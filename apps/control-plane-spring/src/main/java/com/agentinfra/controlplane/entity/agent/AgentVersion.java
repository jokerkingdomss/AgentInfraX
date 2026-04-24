package com.agentinfra.controlplane.entity.agent;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("agent_versions")
public class AgentVersion {

    @TableId(type = IdType.INPUT)
    private String id;

    @TableField("\"agentId\"")
    private String agentId;

    private String version;

    private String image;

    private String entrypoint;   // jsonb, 存为 String，如 "[]"

    private String env;          // jsonb, 存为 String，如 "{}"

    private String resources;    // jsonb, 存为 String，如 "{\"cpu\":\"500m\",\"memory\":\"512Mi\"}"

    private Integer timeout;     // seconds, default 300

    @TableField(value = "\"createdAt\"", fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
