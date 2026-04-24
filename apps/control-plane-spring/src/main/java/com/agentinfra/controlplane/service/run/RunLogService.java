package com.agentinfra.controlplane.service.run;

import com.agentinfra.controlplane.dto.run.RunLogResponse;
import com.baomidou.mybatisplus.extension.service.IService;
import com.agentinfra.controlplane.entity.run.RunLog;

import java.util.List;

public interface RunLogService extends IService<RunLog> {
    RunLogResponse append(String runId, String level, String message);

    List<RunLogResponse> findByRun(String runId);
}
