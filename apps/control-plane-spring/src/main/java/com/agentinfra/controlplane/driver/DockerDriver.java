package com.agentinfra.controlplane.driver;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.command.CreateContainerResponse;
import com.github.dockerjava.api.command.InspectContainerResponse;
import com.github.dockerjava.api.model.HostConfig;
import com.github.dockerjava.core.DefaultDockerClientConfig;
import com.github.dockerjava.core.DockerClientImpl;
import com.github.dockerjava.httpclient5.ApacheDockerHttpClient;
import jakarta.annotation.PostConstruct;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class DockerDriver {

    private DockerClient dockerClient;
    private final Map<String, String> containerIds = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        var config = DefaultDockerClientConfig.createDefaultConfigBuilder().build();
        var httpClient = new ApacheDockerHttpClient.Builder()
                .dockerHost(config.getDockerHost())
                .build();
        this.dockerClient = DockerClientImpl.getInstance(config, httpClient);
        log.info("DockerDriver initialized, host: {}", config.getDockerHost());
    }

    public StartResult start(String runId, String image, List<String> entrypoint,
                             Map<String, String> env, Map<String, String> resources) {
        try {
            dockerClient.inspectImageCmd(image).exec();
        } catch (Exception e) {
            try {
                dockerClient.pullImageCmd(image)
                        .start()
                        .awaitCompletion();
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
                throw new RuntimeException("Image pull interrupted", ex);
            }
        }

        List<String> envList = new ArrayList<>();
        if (env != null) {
            env.forEach((k, v) -> envList.add(k + "=" + v));
        }
        envList.add("RUN_ID=" + runId);

        long memory = parseMemory(resources != null ? resources.getOrDefault("memory", "512Mi") : "512Mi");
        long nanoCpus = parseCpu(resources != null ? resources.getOrDefault("cpu", "500m") : "500m");

        var createCmd = dockerClient.createContainerCmd(image)
                .withEnv(envList)
                .withLabels(Map.of(
                        "agentinfra.run-id", runId,
                        "agentinfra.managed", "true"
                ))
                .withHostConfig(HostConfig.newHostConfig()
                        .withMemory(memory)
                        .withNanoCPUs(nanoCpus));

        if (entrypoint != null && !entrypoint.isEmpty()) {
            createCmd.withCmd(entrypoint);
        }

        CreateContainerResponse container = createCmd.exec();
        String containerId = container.getId();
        containerIds.put(runId, containerId);

        dockerClient.startContainerCmd(containerId).exec();
        log.info("Container started: {} for run: {}", containerId.substring(0, 12), runId);

        StartResult result = new StartResult();
        result.setContainerId(containerId);
        result.setStatus("running");
        result.setStartedAt(LocalDateTime.now());
        return result;
    }

    public void stop(String runId) {
        String cId = containerIds.get(runId);
        if (cId == null) {
            return;
        }
        try {
            dockerClient.stopContainerCmd(cId).withTimeout(10).exec();
        } catch (Exception ignored) {
        }
        try {
            dockerClient.removeContainerCmd(cId).withForce(true).exec();
        } catch (Exception ignored) {
        }
        containerIds.remove(runId);
    }

    private long parseCpu(String cpu) {
        if (cpu.endsWith("m")) {
            return Long.parseLong(cpu.replace("m", "")) * 1_000_000L;
        }
        return (long) (Double.parseDouble(cpu) * 1_000_000_000L);
    }

    private long parseMemory(String mem) {
        Map<String, Long> units = Map.of(
                "Ki", 1024L, "Mi", 1024L * 1024, "Gi", 1024L * 1024 * 1024,
                "K", 1000L, "M", 1000L * 1000, "G", 1000L * 1000 * 1000
        );
        for (var entry : units.entrySet()) {
            if (mem.endsWith(entry.getKey())) {
                return Long.parseLong(mem.replace(entry.getKey(), "")) * entry.getValue();
            }
        }
        return Long.parseLong(mem);
    }

    public StatusResult status(String runId) {
        String cid = containerIds.get(runId);
        if (cid == null) {
            StatusResult r = new StatusResult();
            r.setStatus("failed");
            r.setErrorMessage("container not tracked");
            return r;
        }

        InspectContainerResponse info;
        try {
            info = dockerClient.inspectContainerCmd(cid).exec();
        } catch (Exception e) {
            containerIds.remove(runId);
            StatusResult r = new StatusResult();
            r.setStatus("failed");
            r.setErrorMessage("container not found");
            return r;
        }

        InspectContainerResponse.ContainerState state = info.getState();
        StatusResult result = new StatusResult();
        result.setContainerId(cid);

        if (Boolean.TRUE.equals(state.getRunning())) {
            result.setStatus("running");
            return result;
        }

        int exitCode = state.getExitCode() != null ? state.getExitCode() : -1;
        result.setStatus(exitCode == 0 ? "succeeded" : "failed");
        result.setExitCode(exitCode);
        result.setFinishedAt(LocalDateTime.now());
        if (exitCode != 0) {
            String err = state.getError();
            result.setErrorMessage(err != null && !err.isEmpty() ? err : "exit code " + exitCode);
        }

        containerIds.remove(runId);
        return result;
    }

    @Data
    public static class StartResult {
        private String containerId;
        private String status;
        private LocalDateTime startedAt;
    }

    @Data
    public static class StatusResult {
        private String containerId;
        private String status;
        private Integer exitCode;
        private String errorMessage;
        private LocalDateTime finishedAt;
    }
}
