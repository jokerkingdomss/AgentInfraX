package com.agentinfra.controlplane.entity.run;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("runs")
public class Run {
    @TableId(type = IdType.INPUT)
    private String id;

    @TableField("\"agentId\"")
    private String agentId;

    @TableField("\"agentVersionId\"")
    private String agentVersionId;

    private String status;           // pending, starting, running, succeeded, failed, stopped

    @TableField("\"containerId\"")
    private String containerId;

    @TableField("\"startedAt\"")
    private LocalDateTime startedAt;

    @TableField("\"finishedAt\"")
    private LocalDateTime finishedAt;

    @TableField("\"exitCode\"")
    private Integer exitCode;

    @TableField("\"errorMessage\"")
    private String errorMessage;

    @TableField(value = "\"createdAt\"", fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
