package com.agentinfra.controlplane.dto.agent;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateAgentRequest {

    @NotBlank(message = "name is required")
    @Size(min = 1, max = 64)
    @Pattern(regexp = "^[a-z0-9][a-z0-9-]*$", message = "lowercase, digits, and hyphens only")
    private String name;

    @Size(max = 500)
    private String description;
}
