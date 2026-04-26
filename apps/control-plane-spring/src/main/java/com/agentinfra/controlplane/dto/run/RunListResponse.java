package com.agentinfra.controlplane.dto.run;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class RunListResponse {
    private List<RunResponse> items;
    private long total;
}
