package com.agentinfra.controlplane.dto.run;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RunResponse {
    private String id;
    private String agentName;
    private String agentVersion;
    private String status;
    private String containerId;
    private String startedAt;
    private String finishedAt;
    private Integer exitCode;
    private String errorMessage;
    private String createdAt;
}
