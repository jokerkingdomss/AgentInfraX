package com.agentinfra.controlplane.controller.run;


import com.agentinfra.controlplane.dto.run.CreateRunRequest;
import com.agentinfra.controlplane.dto.run.RunResponse;
import com.agentinfra.controlplane.service.run.RunService;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController()
@RequestMapping("/run")
public class RunController {
    @Resource
    RunService runService;

    @PostMapping("/{agentName}/create")
    public RunResponse create(@PathVariable String agentName,
                              @RequestBody CreateRunRequest request) {
        return runService.create(agentName, request);
    }

    @GetMapping("/{agentName}/list")
    public List<RunResponse> listByAgent(@PathVariable String agentName) {
        return runService.findByAgent(agentName);
    }

    @GetMapping("/find/{id}")
    public RunResponse findOne(@PathVariable String id) {
        return runService.findOne(id);
    }

    @PostMapping("/{id}/stop")
    public RunResponse stop(@PathVariable String id) {
        return runService.stop(id);
    }
}
