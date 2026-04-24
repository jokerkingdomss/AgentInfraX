package com.agentinfra.controlplane.dto.run;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RunLogResponse {
    private String id;
    private String runId;
    private String level;
    private String message;
    private String createdAt;
}
