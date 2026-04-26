package com.agentinfra.controlplane.controller.run;


import com.agentinfra.controlplane.dto.run.RunListResponse;
import com.agentinfra.controlplane.dto.run.RunResponse;
import com.agentinfra.controlplane.service.run.RunService;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.*;

@RestController()
@RequestMapping("/runs")
public class RunController {
    @Resource
    RunService runService;

    @GetMapping
    public RunListResponse findAll(
            @RequestParam(defaultValue = "50") int limit,
            @RequestParam(defaultValue = "0") int offset) {
        return runService.findAll(limit, offset);
    }

    @GetMapping("/{id}")
    public RunResponse findOne(@PathVariable String id) {
        return runService.findOne(id);
    }

    @PostMapping("/{id}/stop")
    public RunResponse stop(@PathVariable String id) {
        return runService.stop(id);
    }
}
