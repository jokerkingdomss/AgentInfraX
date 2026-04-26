package com.agentinfra.controlplane.controller.agent;

import com.agentinfra.controlplane.dto.agent.CreateAgentRequest;
import com.agentinfra.controlplane.dto.agent.CreateAgentResponse;
import com.agentinfra.controlplane.dto.agent.CreateVersionRequest;
import com.agentinfra.controlplane.dto.agent.VersionResponse;
import com.agentinfra.controlplane.dto.run.CreateRunRequest;
import com.agentinfra.controlplane.dto.run.RunResponse;
import com.agentinfra.controlplane.service.agent.AgentService;
import com.agentinfra.controlplane.service.run.RunService;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController()
@RequestMapping("/agents")
public class AgentController {

    @Resource
    AgentService agentService;

    @Resource
    RunService runService;

    @PostMapping
    public CreateAgentResponse create(@RequestBody CreateAgentRequest request) {
        return agentService.create(request);
    }

    @GetMapping
    public List<CreateAgentResponse> findAll() {
        return agentService.findAll();
    }

    @GetMapping("/{name}")
    public CreateAgentResponse findByName(@PathVariable String name) {
        return agentService.findByName(name);
    }

    @DeleteMapping("/{name}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@PathVariable String name) {
        agentService.remove(name);
    }

    @PostMapping("/{name}/versions")
    public VersionResponse addVersion(@PathVariable String name,
                                      @Valid @RequestBody CreateVersionRequest request) {
        return agentService.addVersion(name, request);
    }
    @GetMapping("/{name}/versions")
    public List<VersionResponse> listVersion(@PathVariable String name) {
        return agentService.listVersion(name);
    }

    @PostMapping("/{name}/runs")
    public RunResponse createRun(@PathVariable String name,
                                 @RequestBody CreateRunRequest request) {
        return runService.create(name, request);
    }

    @GetMapping("/{name}/runs")
    public List<RunResponse> listRuns(@PathVariable String name) {
        return runService.findByAgent(name);
    }

}
