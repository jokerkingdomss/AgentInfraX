package com.agentinfra.controlplane.service.agent.impl;

import com.agentinfra.controlplane.dto.agent.CreateAgentRequest;
import com.agentinfra.controlplane.dto.agent.CreateAgentResponse;
import com.agentinfra.controlplane.dto.agent.CreateVersionRequest;
import com.agentinfra.controlplane.dto.agent.VersionResponse;
import com.agentinfra.controlplane.entity.agent.Agent;
import com.agentinfra.controlplane.entity.agent.AgentVersion;
import com.agentinfra.controlplane.mapper.agent.AgentMapper;
import com.agentinfra.controlplane.service.agent.AgentService;
import com.agentinfra.controlplane.service.agent.AgentVersionService;
import com.agentinfra.controlplane.utils.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.f4b6a3.uuid.UuidCreator;
import jakarta.annotation.Resource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class AgentServiceImpl extends ServiceImpl<AgentMapper, Agent> implements AgentService {

    @Autowired
    @Resource
    AgentVersionService agentVersionService;

    @Override
    public CreateAgentResponse create(CreateAgentRequest request) {
        Agent existing = getBaseMapper().selectOne(
                new LambdaQueryWrapper<Agent>().eq(Agent::getName, request.getName())
        );
        if (existing != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "agent \"" + request.getName() + "\" already exists");
        }

        Agent agent = new Agent();
        agent.setId(UuidCreator.getTimeOrderedEpoch().toString());
        agent.setName(request.getName());
        agent.setDescription(request.getDescription());
        getBaseMapper().insert(agent);

        return CreateAgentResponse.builder()
                .id(agent.getId()).name(agent.getName())
                .description(agent.getDescription())
                .createdAt(agent.getCreatedAt().toString())
                .updatedAt(agent.getUpdatedAt().toString())
                .latestVersion(null)
                .build();
    }

    @Override
    public List<CreateAgentResponse> findAll() {
        List<Agent> agents = getBaseMapper().selectList(new LambdaQueryWrapper<Agent>().orderByDesc(Agent::getCreatedAt));

        return agents.stream().map(a -> {
            return CreateAgentResponse.builder()
                    .id(a.getId())
                    .name(a.getName())
                    .description(a.getDescription())
                    .createdAt(a.getCreatedAt().toString())
                    .updatedAt(a.getUpdatedAt().toString())
                    .latestVersion(null)  // 第三阶段再查版本
                    .build();
        }).toList();
    }

    @Override
    public CreateAgentResponse findByName(String name) {
        Agent agent = getBaseMapper().selectOne(new LambdaQueryWrapper<Agent>().eq(Agent::getName, name));
        if (agent == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "agent \"" + name + "\" not found");
        }
        return CreateAgentResponse.builder()
                .id(agent.getId())
                .name(agent.getName())
                .description(agent.getDescription())
                .createdAt(agent.getCreatedAt().toString())
                .updatedAt(agent.getUpdatedAt().toString())
                .latestVersion(null)
                .build();
    }

    @Override
    public void remove(String name) {
        Agent agent = getBaseMapper().selectOne(new LambdaQueryWrapper<Agent>().eq(Agent::getName, name));
        if (agent == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "agent \"" + name + "\" not found");
        }
        getBaseMapper().deleteById(agent.getId());
    }

    @Override
    public VersionResponse addVersion(String name, CreateVersionRequest request) {
        Agent agent = getBaseMapper().selectOne(new LambdaQueryWrapper<Agent>().eq(Agent::getName, name));
        if (agent == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "agent \"" + name + "\" not found");
        }
        AgentVersion existing = agentVersionService.getBaseMapper().selectOne(new LambdaQueryWrapper<AgentVersion>()
                .eq(AgentVersion::getAgentId, agent.getId())
                .eq(AgentVersion::getVersion, request.getVersion()));
        if (existing != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "version \"" + existing.getVersion() + "\" already exists");
        }
        AgentVersion agentVersion = new AgentVersion();
        agentVersion.setId(UuidCreator.getTimeOrderedEpoch().toString());
        agentVersion.setAgentId(agent.getId());
        agentVersion.setVersion(request.getVersion());
        agentVersion.setImage(request.getImage());
        agentVersion.setEntrypoint(JSONUtil.toJson(request.getEntrypoint()));
        agentVersion.setEnv(JSONUtil.toJson(request.getEnv()));
        agentVersion.setResources(JSONUtil.toJson(request.getResources()));
        agentVersionService.getBaseMapper().insert(agentVersion);
        return VersionResponse.builder().build();
    }

    @Override
    public List<VersionResponse> listVersion(String name) {
        Agent agent = getBaseMapper().selectOne(new LambdaQueryWrapper<Agent>().eq(Agent::getName, name));
        if (agent == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "agent \"" + name + "\" not found");
        }
        List<AgentVersion> agentVersions = agentVersionService.getBaseMapper().selectList(
                new LambdaQueryWrapper<AgentVersion>()
                        .eq(AgentVersion::getAgentId, agent.getId())
                        .orderByDesc(AgentVersion::getCreatedAt)
        );
        return agentVersions.stream().map(a -> VersionResponse.builder()
                .id(a.getId())
                .agentId(a.getAgentId())
                .version(a.getVersion())
                .image(a.getImage())
                .entrypoint(a.getEntrypoint())
                .env(a.getEnv())
                .resources(a.getResources())
                .createdAt(a.getCreatedAt().toString())
                .build()
        ).toList();
    }


}
