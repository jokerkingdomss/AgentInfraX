package com.agentinfra.controlplane.controller;


import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController()
public class HealthyController {

    @GetMapping("/healthy")
    public Map<String, String> Healthy(){
        return Map.of("message", "hello");
    }
}
