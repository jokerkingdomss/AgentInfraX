package com.agentinfra.controlplane.entity.run;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("run_logs")
public class RunLog {
    @TableId(type = IdType.INPUT)
    private String id;

    @TableField("\"runId\"")
    private String runId;

    private String level;

    private String message;

    @TableField(value = "\"createdAt\"", fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
