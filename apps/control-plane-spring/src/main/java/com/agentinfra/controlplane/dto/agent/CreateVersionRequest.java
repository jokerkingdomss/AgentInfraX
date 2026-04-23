package com.agentinfra.controlplane.dto.agent;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class CreateVersionRequest {

    @NotBlank(message = "version is required")
    private String version;

    @NotBlank(message = "image is required")
    private String image;

    private List<String> entrypoint;        // 可选，默认 []

    private Map<String, String> env;        // 可选，默认 {}

    private Map<String, String> resources;  // 可选，默认 {"cpu":"500m","memory":"512Mi"}
}
