package com.agentinfra.controlplane.controller.agent;

import com.agentinfra.controlplane.dto.agent.CreateAgentRequest;
import com.agentinfra.controlplane.dto.agent.CreateAgentResponse;
import com.agentinfra.controlplane.dto.agent.CreateVersionRequest;
import com.agentinfra.controlplane.dto.agent.VersionResponse;
import com.agentinfra.controlplane.service.agent.AgentService;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController()
@RequestMapping("/agent")
public class AgentController {

    @Resource
    AgentService agentService;

    @PostMapping("/create")
    public CreateAgentResponse create(@RequestBody CreateAgentRequest request) {
        return agentService.create(request);
    }

    @GetMapping("/findAll")
    public List<CreateAgentResponse> findAll() {
        return agentService.findAll();
    }

    @GetMapping("/find/{name}")
    public CreateAgentResponse findByName(@PathVariable String name) {
        return agentService.findByName(name);
    }

    @DeleteMapping("/remove/{name}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@PathVariable String name) {
        agentService.remove(name);
    }

    @PostMapping("/{name}/version/add")
    public VersionResponse addVersion(@PathVariable String name,
                                      @Valid @RequestBody CreateVersionRequest request) {
        return agentService.addVersion(name, request);
    }
    @GetMapping("/{name}/version/list")
    public List<VersionResponse> listVersion(@PathVariable String name) {
        return agentService.listVersion(name);
    }

}
