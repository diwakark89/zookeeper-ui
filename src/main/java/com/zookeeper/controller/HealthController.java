package com.zookeeper.controller;

import com.zookeeper.service.ConfigReaderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.OPTIONS})
public class HealthController {

    private final ConfigReaderService configReaderService;

    public HealthController(ConfigReaderService configReaderService) {
        this.configReaderService = configReaderService;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> status = new HashMap<>();
        boolean connected = configReaderService.isConnected();

        status.put("service", "ZooKeeper Dashboard");
        status.put("status", connected ? "connected" : "disconnected");
        status.put("server", configReaderService.getCurrentServer());

        return ResponseEntity.ok(status);
    }
}
