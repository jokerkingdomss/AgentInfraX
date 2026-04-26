package com.agentinfra.controlplane.controller.run;


import com.agentinfra.controlplane.dto.run.RunResponse;
import com.agentinfra.controlplane.service.run.RunService;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.*;

@RestController()
@RequestMapping("/runs")
public class RunController {
    @Resource
    RunService runService;

    @GetMapping("/{id}")
    public RunResponse findOne(@PathVariable String id) {
        return runService.findOne(id);
    }

    @PostMapping("/{id}/stop")
    public RunResponse stop(@PathVariable String id) {
        return runService.stop(id);
    }
}
