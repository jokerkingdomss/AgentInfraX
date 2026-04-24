package com.agentinfra.controlplane.service.run.Impl;

import com.agentinfra.controlplane.dto.run.RunLogResponse;
import com.agentinfra.controlplane.entity.run.Run;
import com.agentinfra.controlplane.entity.run.RunLog;
import com.agentinfra.controlplane.mapper.run.RunLogMapper;
import com.agentinfra.controlplane.mapper.run.RunMapper;
import com.agentinfra.controlplane.service.run.RunLogService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.github.f4b6a3.uuid.UuidCreator;
import jakarta.annotation.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class RunLogServiceImpl extends ServiceImpl<RunLogMapper, RunLog> implements RunLogService {

    @Resource
    RunMapper runMapper;

    @Override
    public RunLogResponse append(String runId, String level, String message) {
        Run run = runMapper.selectById(runId);
        if (run == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "run " + runId + " not found");
        }

        RunLog log = new RunLog();
        log.setId(UuidCreator.getTimeOrderedEpoch().toString());
        log.setRunId(runId);
        log.setLevel(level != null ? level : "info");
        log.setMessage(message);
        getBaseMapper().insert(log);

        return toDto(log);
    }

    @Override
    public List<RunLogResponse> findByRun(String runId) {
        Run run = runMapper.selectById(runId);
        if (run == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "run " + runId + " not found");
        }

        List<RunLog> logs = getBaseMapper().selectList(
                new LambdaQueryWrapper<RunLog>()
                        .eq(RunLog::getRunId, runId)
                        .orderByAsc(RunLog::getCreatedAt));
        return logs.stream().map(this::toDto).toList();
    }

    private RunLogResponse toDto(RunLog l) {
        return RunLogResponse.builder()
                .id(l.getId())
                .runId(l.getRunId())
                .level(l.getLevel())
                .message(l.getMessage())
                .createdAt(l.getCreatedAt() != null ? l.getCreatedAt().toString() : null)
                .build();
    }
}
