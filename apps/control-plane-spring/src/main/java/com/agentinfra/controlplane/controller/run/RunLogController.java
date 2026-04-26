package com.agentinfra.controlplane.controller.run;

import com.agentinfra.controlplane.dto.run.CreateRunLogRequest;
import com.agentinfra.controlplane.dto.run.RunLogResponse;
import com.agentinfra.controlplane.service.run.RunLogService;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/runs")
public class RunLogController {

    @Resource
    RunLogService runLogService;

    @PostMapping("/{id}/logs")
    public RunLogResponse append(@PathVariable String id,
                                 @RequestBody CreateRunLogRequest request) {
        return runLogService.append(id, request.getLevel(), request.getMessage());
    }

    @GetMapping("/{id}/logs")
    public List<RunLogResponse> findByRun(@PathVariable String id) {
        return runLogService.findByRun(id);
    }
}
