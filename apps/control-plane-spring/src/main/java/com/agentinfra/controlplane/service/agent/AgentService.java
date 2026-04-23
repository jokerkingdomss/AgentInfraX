package com.agentinfra.controlplane.service.agent;

import com.agentinfra.controlplane.dto.agent.CreateAgentRequest;
import com.agentinfra.controlplane.dto.agent.CreateAgentResponse;
import com.agentinfra.controlplane.dto.agent.CreateVersionRequest;
import com.agentinfra.controlplane.dto.agent.VersionResponse;
import com.agentinfra.controlplane.entity.agent.Agent;
import com.baomidou.mybatisplus.extension.service.IService;

import java.util.List;

public interface AgentService extends IService<Agent> {

    CreateAgentResponse create(CreateAgentRequest request);

    List<CreateAgentResponse> findAll();

    CreateAgentResponse findByName(String name);

    void remove(String name);

    VersionResponse addVersion(String name, CreateVersionRequest request);

    List<VersionResponse> listVersion(String name);
}

