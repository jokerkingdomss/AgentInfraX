package com.agentinfra.controlplane.controller.agent;

import com.agentinfra.controlplane.dto.agent.CreateAgentRequest;
import com.agentinfra.controlplane.dto.agent.CreateAgentResponse;
import com.agentinfra.controlplane.service.agent.AgentService;
import jakarta.annotation.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
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
}
