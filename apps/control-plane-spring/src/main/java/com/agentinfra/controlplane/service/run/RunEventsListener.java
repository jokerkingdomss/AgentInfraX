package com.agentinfra.controlplane.service.run;

import com.agentinfra.controlplane.driver.DockerDriver;
import com.agentinfra.controlplane.entity.run.Run;
import com.agentinfra.controlplane.mapper.run.RunMapper;
import com.github.dockerjava.api.model.Event;
import com.github.dockerjava.core.command.EventsResultCallback;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.ScheduledThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
public class RunEventsListener {

    private static final Set<String> TERMINAL_ACTIONS = Set.of("die", "stop", "destroy", "oom");

    private final DockerDriver dockerDriver;
    private final RunMapper runMapper;
    private final RunLogsSocketService socketService;
    private final StringRedisTemplate redis;
    private final ScheduledThreadPoolExecutor scheduler = new ScheduledThreadPoolExecutor(4);
    private final Map<String, ScheduledFuture<?>> timeoutFutures = new ConcurrentHashMap<>();
    private EventsResultCallback eventCallback;

    public RunEventsListener(DockerDriver dockerDriver,
                             RunMapper runMapper,
                             RunLogsSocketService socketService,
                             StringRedisTemplate redis) {
        this.dockerDriver = dockerDriver;
        this.runMapper = runMapper;
        this.socketService = socketService;
        this.redis = redis;
    }

    @PostConstruct
    public void start() {
        eventCallback = new EventsResultCallback() {
            @Override
            public void onNext(Event event) {
                try {
                    handleEvent(event);
                } catch (Exception e) {
                    log.error("Error handling Docker event: {}", e.getMessage(), e);
                }
                super.onNext(event);
            }
        };

        dockerDriver.getDockerClient().eventsCmd()
                .withEventTypeFilter(com.github.dockerjava.api.model.EventType.CONTAINER)
                .withEventFilter("start", "die", "stop", "destroy", "oom")
                .exec(eventCallback);

        log.info("Subscribed to Docker container lifecycle events");
    }

    @PreDestroy
    public void stop() {
        try {
            if (eventCallback != null) {
                eventCallback.close();
            }
        } catch (Exception e) {
            log.warn("Error closing Docker event stream: {}", e.getMessage());
        }
        scheduler.shutdownNow();
        timeoutFutures.clear();
    }

    /**
     * Schedule a timeout for a run. If no terminal event arrives within
     * timeoutSeconds, the run is force-stopped and marked failed.
     */
    public void scheduleTimeout(String runId, int timeoutSeconds) {
        ScheduledFuture<?> existing = timeoutFutures.remove(runId);
        if (existing != null) existing.cancel(false);

        ScheduledFuture<?> future = scheduler.schedule(() -> {
            timeoutFutures.remove(runId);
            log.warn("Run {} timed out after {}s", runId, timeoutSeconds);
            try {
                dockerDriver.stop(runId);
            } catch (Exception ignored) {}
            Run run = runMapper.selectById(runId);
            if (run != null) {
                run.setStatus("failed");
                run.setFinishedAt(LocalDateTime.now());
                run.setErrorMessage("Run timed out after " + timeoutSeconds + "s");
                runMapper.updateById(run);
                socketService.emitStatusUpdated(runId, "failed");
            }
        }, timeoutSeconds, TimeUnit.SECONDS);

        timeoutFutures.put(runId, future);
    }

    private void handleEvent(Event event) {
        String containerId = event.getActor() != null ? event.getActor().getId() : null;
        if (containerId == null) return;

        String action = event.getAction();
        if (action == null) return;

        // Resolve runId: Redis → driver map → DB
        String runId = resolveRunId(containerId);
        if (runId == null) return; // Not an agentinfra container

        log.info("Container event: {} for run {}...", action, runId.substring(0, Math.min(8, runId.length())));

        if ("start".equals(action)) {
            Run run = runMapper.selectById(runId);
            if (run != null) {
                run.setStatus("running");
                run.setStartedAt(LocalDateTime.now());
                runMapper.updateById(run);
                socketService.emitStatusUpdated(runId, "running");
            }
            return;
        }

        if (!TERMINAL_ACTIONS.contains(action)) return;

        // Terminal event — cancel timeout
        ScheduledFuture<?> future = timeoutFutures.remove(runId);
        if (future != null) future.cancel(false);

        // Fetch final status from driver
        String status;
        LocalDateTime finishedAt = LocalDateTime.now();
        Integer exitCode = null;
        String errorMessage = null;

        try {
            DockerDriver.StatusResult h = dockerDriver.status(runId);
            status = h.getStatus();
            finishedAt = h.getFinishedAt() != null ? h.getFinishedAt() : LocalDateTime.now();
            exitCode = h.getExitCode();
            errorMessage = h.getErrorMessage();
        } catch (Exception e) {
            Map<String, String> attrs = event.getActor() != null ? event.getActor().getAttributes() : null;
            String exitStr = attrs != null ? attrs.get("exitCode") : null;
            if (exitStr != null) {
                exitCode = Integer.parseInt(exitStr);
                status = exitCode == 0 ? "succeeded" : "failed";
                if (exitCode != 0) errorMessage = "exit code " + exitCode;
            } else {
                status = "failed";
                errorMessage = e.getMessage();
            }
        }

        // Don't overwrite a manually-stopped run
        Run current = runMapper.selectById(runId);
        if (current == null || "stopped".equals(current.getStatus())) return;

        current.setStatus(status);
        current.setFinishedAt(finishedAt);
        current.setExitCode(exitCode);
        current.setErrorMessage(errorMessage);
        runMapper.updateById(current);
        socketService.emitStatusUpdated(runId, status);
    }

    /** Resolve runId by containerId: Redis → driver map → DB. */
    private String resolveRunId(String containerId) {
        // 1. Redis lookup
        String cached = redis.opsForValue().get("run:container:" + containerId);
        if (cached != null) return cached;

        // 2. Driver in-memory map
        String runId = dockerDriver.getRunId(containerId);
        if (runId != null) return runId;

        // 3. DB fallback
        Run run = runMapper.selectOne(
                new LambdaQueryWrapper<Run>().eq(Run::getContainerId, containerId));
        return run != null ? run.getId() : null;
    }
}
