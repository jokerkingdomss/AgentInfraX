package com.agentinfra.controlplane.dto.run;

import lombok.Data;

@Data
public class CreateRunLogRequest {
    private String level;
    private String message;
}
