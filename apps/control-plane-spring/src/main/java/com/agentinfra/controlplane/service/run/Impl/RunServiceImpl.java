package com.agentinfra.controlplane.service.run.Impl;

import com.agentinfra.controlplane.driver.DockerDriver;
import com.agentinfra.controlplane.dto.run.CreateRunRequest;
import com.agentinfra.controlplane.dto.run.RunResponse;
import com.agentinfra.controlplane.entity.agent.Agent;
import com.agentinfra.controlplane.entity.agent.AgentVersion;
import com.agentinfra.controlplane.entity.run.Run;
import com.agentinfra.controlplane.mapper.run.RunMapper;
import com.agentinfra.controlplane.service.agent.AgentService;
import com.agentinfra.controlplane.service.agent.AgentVersionService;
import com.agentinfra.controlplane.service.run.RunService;
import com.agentinfra.controlplane.utils.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.github.f4b6a3.uuid.UuidCreator;
import jakarta.annotation.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
public class RunServiceImpl extends ServiceImpl<RunMapper, Run> implements RunService {

    @Resource
    AgentService agentService;

    @Resource
    AgentVersionService agentVersionService;

    @Resource
    DockerDriver dockerDriver;

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
                pollUntilDone(run.getId());
            } catch (Exception e) {
                run.setStatus("failed");
                run.setErrorMessage(e.getMessage());
                run.setFinishedAt(LocalDateTime.now());
                getBaseMapper().updateById(run);
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
        dockerDriver.stop(runId);
        run.setStatus("stopped");
        run.setFinishedAt(LocalDateTime.now());
        getBaseMapper().updateById(run);
        return findOne(run.getId());
    }

    void pollUntilDone(String runId) {
        List<String> terminal = List.of("succeeded", "failed", "stopped");
        for (int i = 0; i < 120; i++) {
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return;
            }
            DockerDriver.StatusResult h;
            try {
                h = dockerDriver.status(runId);
            } catch (Exception e) {
                return;
            }
            Run run = getBaseMapper().selectById(runId);
            if (run == null) return;
            run.setStatus(h.getStatus());
            run.setFinishedAt(h.getFinishedAt());
            run.setExitCode(h.getExitCode());
            run.setErrorMessage(h.getErrorMessage());
            getBaseMapper().updateById(run);
            if (terminal.contains(h.getStatus())) return;
        }
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
