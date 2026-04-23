package com.agentinfra.controlplane.dto.agent;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VersionResponse {
    private String id;
    private String agentId;
    private String version;
    private String image;
    private String entrypoint;   // JSON string, 如 "[]"
    private String env;          // JSON string, 如 "{}"
    private String resources;    // JSON string, 如 "{\"cpu\":\"500m\"}"
    private String createdAt;
}
