package com.agentinfra.controlplane.service.run;

import com.agentinfra.controlplane.dto.run.CreateRunRequest;
import com.agentinfra.controlplane.dto.run.RunListResponse;
import com.agentinfra.controlplane.dto.run.RunResponse;
import com.agentinfra.controlplane.entity.run.Run;
import com.baomidou.mybatisplus.extension.service.IService;

import java.util.List;

public interface RunService extends IService<Run> {
    RunResponse create(String agentName, CreateRunRequest request);

    List<RunResponse> findByAgent(String agentName);

    RunListResponse findAll(int limit, int offset);

    RunResponse findOne(String runId);

    RunResponse stop(String runId);
}
