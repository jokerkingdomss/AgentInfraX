package com.agentinfra.controlplane.dto.run;

import lombok.Data;

import java.util.Map;

@Data
public class CreateRunRequest {
    private String version;              // 可选，不传则用最新版本
    private Map<String, String> env;     // 可选，运行时额外环境变量
}
