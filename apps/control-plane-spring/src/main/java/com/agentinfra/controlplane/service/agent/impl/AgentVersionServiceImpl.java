package com.agentinfra.controlplane.service.agent.impl;

import com.agentinfra.controlplane.entity.agent.AgentVersion;
import com.agentinfra.controlplane.mapper.agent.AgentVersionMapper;
import com.agentinfra.controlplane.service.agent.AgentVersionService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.springframework.stereotype.Service;

@Service
public class AgentVersionServiceImpl extends ServiceImpl<AgentVersionMapper, AgentVersion> implements AgentVersionService {
}
