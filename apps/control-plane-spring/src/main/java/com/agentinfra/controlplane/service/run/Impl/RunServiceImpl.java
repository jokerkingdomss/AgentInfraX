package com.agentinfra.controlplane.service.run.Impl;

import com.agentinfra.controlplane.driver.DockerDriver;
import com.agentinfra.controlplane.dto.run.CreateRunRequest;
import com.agentinfra.controlplane.dto.run.RunListResponse;
import com.agentinfra.controlplane.dto.run.RunResponse;
import com.agentinfra.controlplane.entity.agent.Agent;
import com.agentinfra.controlplane.entity.agent.AgentVersion;
import com.agentinfra.controlplane.entity.run.Run;
import com.agentinfra.controlplane.mapper.run.RunMapper;
import com.agentinfra.controlplane.service.agent.AgentService;
import com.agentinfra.controlplane.service.agent.AgentVersionService;
import com.agentinfra.controlplane.service.run.RunService;
import com.agentinfra.controlplane.service.run.RunLogService;
import com.agentinfra.controlplane.service.run.RunLogsSocketService;
import com.agentinfra.controlplane.service.run.RunEventsListener;
import com.agentinfra.controlplane.utils.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.github.f4b6a3.uuid.UuidCreator;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.Closeable;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class RunServiceImpl extends ServiceImpl<RunMapper, Run> implements RunService {

    @Resource
    AgentService agentService;

    @Resource
    AgentVersionService agentVersionService;

    @Resource
    DockerDriver dockerDriver;

    @Resource
    RunLogsSocketService socketService;

    @Resource
    RunEventsListener eventsListener;

    @Resource
    RunLogService runLogService;

    @Resource
    StringRedisTemplate stringRedisTemplate;

    /** Active log streams per runId, closed on stop or container exit. */
    private final Map<String, Closeable> logStreams = new ConcurrentHashMap<>();

    @Override
    public RunResponse create(String agentName, CreateRunRequest request) {
        Agent agent = agentService.getBaseMapper().selectOne(
                new LambdaQueryWrapper<Agent>().eq(Agent::getName, agentName));
        if (agent == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "agent \"" + agentName + "\" not found");
        }

        LambdaQueryWrapper<AgentVersion> versionQuery = new LambdaQueryWrapper<AgentVersion>()
                .eq(AgentVersion::getAgentId, agent.getId());
        if (request.getVersion() != null && !request.getVersion().isBlank()) {
            versionQuery.eq(AgentVersion::getVersion, request.getVersion());
        } else {
            versionQuery.orderByDesc(AgentVersion::getCreatedAt).last("LIMIT 1");
        }
        AgentVersion version = agentVersionService.getBaseMapper().selectOne(versionQuery);
        if (version == null) {
            String msg = request.getVersion() != null
                    ? "version " + request.getVersion() + " not found for " + agentName
                    : "agent \"" + agentName + "\" has no versions yet";
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, msg);
        }

        Run run = new Run();
        run.setId(UuidCreator.getTimeOrderedEpoch().toString());
        run.setAgentId(agent.getId());
        run.setAgentVersionId(version.getId());
        run.setStatus("pending");
        getBaseMapper().insert(run);

        CompletableFuture.runAsync(() -> {
            try {
                DockerDriver.StartResult result = dockerDriver.start(run.getId(),
                        version.getImage(),
                        JSONUtil.parseList(version.getEntrypoint()),
                        JSONUtil.parseMap(version.getEnv()),
                        JSONUtil.parseMap(version.getResources()));
                run.setStatus(result.getStatus());
                run.setContainerId(result.getContainerId());
                run.setStartedAt(result.getStartedAt());
                getBaseMapper().updateById(run);
                // Store containerId → runId mapping in Redis for event-driven lookups.
                if (result.getContainerId() != null) {
                    stringRedisTemplate.opsForValue().set(
                            "run:container:" + result.getContainerId(),
                            run.getId(),
                            java.time.Duration.ofHours(24));
                }
                socketService.emitStatusUpdated(run.getId(), result.getStatus());
                int timeout = version.getTimeout() != null ? version.getTimeout() : 300;
                eventsListener.scheduleTimeout(run.getId(), timeout);
                // Stream container stdout/stderr to logs in real time.
                Closeable logStream = dockerDriver.streamLogs(run.getId(), line -> {
                    try {
                        runLogService.append(run.getId(), "info", line);
                    } catch (Exception e) {
                        log.warn("Failed to append log for run {}: {}", run.getId(), e.getMessage());
                    }
                });
                logStreams.put(run.getId(), logStream);
            } catch (Exception e) {
                run.setStatus("failed");
                run.setErrorMessage(e.getMessage());
                run.setFinishedAt(LocalDateTime.now());
                getBaseMapper().updateById(run);
                socketService.emitStatusUpdated(run.getId(), "failed");
            }
        });

        return toDto(run, agent.getName(), version.getVersion());
    }

    @Override
    public List<RunResponse> findByAgent(String agentName) {
        Agent agent = agentService.getBaseMapper().selectOne(
                new LambdaQueryWrapper<Agent>().eq(Agent::getName, agentName));
        if (agent == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "agent \"" + agentName + "\" not found");
        }
        List<Run> runs = getBaseMapper().selectList(
                new LambdaQueryWrapper<Run>()
                        .eq(Run::getAgentId, agent.getId())
                        .orderByDesc(Run::getCreatedAt));
        return runs.stream().map(r -> {
            AgentVersion v = agentVersionService.getBaseMapper().selectById(r.getAgentVersionId());
            return toDto(r, agent.getName(), v != null ? v.getVersion() : null);
        }).toList();
    }

    @Override
    public RunListResponse findAll(int limit, int offset) {
        long page = (offset / limit) + 1;
        Page<Run> runPage = new Page<>(page, limit);
        LambdaQueryWrapper<Run> wrapper = new LambdaQueryWrapper<Run>()
                .orderByDesc(Run::getCreatedAt);
        Page<Run> result = getBaseMapper().selectPage(runPage, wrapper);
        List<RunResponse> items = result.getRecords().stream().map(r -> {
            Agent agent = agentService.getBaseMapper().selectById(r.getAgentId());
            AgentVersion v = agentVersionService.getBaseMapper().selectById(r.getAgentVersionId());
            return toDto(r,
                    agent != null ? agent.getName() : null,
                    v != null ? v.getVersion() : null);
        }).toList();
        return RunListResponse.builder().items(items).total(result.getTotal()).build();
    }

    @Override
    public RunResponse findOne(String runId) {
        Run run = getBaseMapper().selectById(runId);
        if (run == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "run " + runId + " not found");
        }
        Agent agent = agentService.getBaseMapper().selectById(run.getAgentId());
        AgentVersion version = agentVersionService.getBaseMapper().selectById(run.getAgentVersionId());
        return toDto(run,
                agent != null ? agent.getName() : null,
                version != null ? version.getVersion() : null);
    }

    @Override
    public RunResponse stop(String runId) {
        Run run = getBaseMapper().selectById(runId);
        if (run == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "run " + runId + " not found");
        }
        // Close log stream before stopping container.
        Closeable logStream = logStreams.remove(runId);
        if (logStream != null) {
            try { logStream.close(); } catch (Exception ignored) {}
        }
        run.setStatus("stopped");
        run.setFinishedAt(LocalDateTime.now());
        getBaseMapper().updateById(run);
        socketService.emitStatusUpdated(runId, "stopped");
        dockerDriver.stop(runId);
        return findOne(run.getId());
    }

    private RunResponse toDto(Run r, String agentName, String agentVersion) {
        return RunResponse.builder()
                .id(r.getId())
                .agentName(agentName)
                .agentVersion(agentVersion)
                .status(r.getStatus())
                .containerId(r.getContainerId())
                .startedAt(r.getStartedAt() != null ? r.getStartedAt().toString() : null)
                .finishedAt(r.getFinishedAt() != null ? r.getFinishedAt().toString() : null)
                .exitCode(r.getExitCode())
                .errorMessage(r.getErrorMessage())
                .createdAt(r.getCreatedAt().toString())
                .build();
    }
}
