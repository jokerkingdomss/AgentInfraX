package com.agentinfra.controlplane.entity.agent;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import org.apache.ibatis.type.JdbcType;

import java.time.LocalDateTime;


@Data
@TableName("agents")
public class Agent {
    @TableId(type = IdType.INPUT)
    private String id;

    private String name;
    private String description;

    @TableField(value = "\"createdAt\"", fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(value = "\"updatedAt\"", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
