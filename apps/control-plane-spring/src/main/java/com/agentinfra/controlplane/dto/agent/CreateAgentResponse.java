package com.agentinfra.controlplane.dto.agent;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CreateAgentResponse {
    private String id;
    private String name;
    private String description;
    private String createdAt;
    private String updatedAt;
    private String latestVersion;
}
