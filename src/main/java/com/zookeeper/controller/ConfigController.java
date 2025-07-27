package com.zookeeper.controller;

import com.zookeeper.service.ConfigReaderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import com.zookeeper.config.ZookeeperConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS}, allowCredentials = "false")
public class ConfigController {
    private static final Logger log = LoggerFactory.getLogger(ConfigController.class);
    private final ConfigReaderService configReaderService;

    @Value("${zookeeper.server}")
    private String currentServer;

    // Removed the direct @Value injection for servers list
    private List<Map<String, String>> serverList;

    public ConfigController(ConfigReaderService configReaderService, ZookeeperConfig zookeeperConfig) {
        this.configReaderService = configReaderService;
        this.serverList = zookeeperConfig.getServers();
    }

    @GetMapping("/config")
    public Map<String, String> getZkConfig(@RequestParam String parent) {
        return configReaderService.getConfigMap(parent);
    }

    @GetMapping("/config/parent")
    public ResponseEntity<List<String>> getTopLevelNodes() {
        try {
            log.info("API call: Getting top level nodes");
            List<String> nodes = configReaderService.getTopLevelNodes();
            return ResponseEntity.ok(nodes);
        } catch (Exception e) {
            log.error("Error in getTopLevelNodes endpoint: {}", e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }

    @PutMapping("/config")
    public ResponseEntity<Void> updateConfig(@RequestParam String parent,@RequestBody Map<String, String> updates) {
        try {
            for (Map.Entry<String, String> entry : updates.entrySet()) {
                String key = entry.getKey();
                String value = entry.getValue();
                configReaderService.writeToZookeeper(parent, key, value);
            }
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @DeleteMapping("/config/{key}")
    public ResponseEntity<Void> deleteConfig(@RequestParam String parent, @PathVariable String key) {
        try {
            configReaderService.deleteFromZookeeper(parent,key);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @DeleteMapping("/config/root/{nodeName}")
    public ResponseEntity<Void> deleteRootNode(@PathVariable String nodeName) {
        try {
            log.info("Deleting root node: {}", nodeName);
            configReaderService.deleteRootNode(nodeName);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error deleting root node {}: {}", nodeName, e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/servers")
    public ResponseEntity<List<Map<String, String>>> getServerList() {
        try {
            return ResponseEntity.ok(serverList);
        } catch (Exception e) {
            log.error("Error getting server list: {}", e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/servers/current")
    public ResponseEntity<String> getCurrentServer() {
        try {
            return ResponseEntity.ok(currentServer);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @PutMapping("/servers/connect")
    public ResponseEntity<Void> connectToServer(@RequestBody Map<String, String> serverInfo) {
        try {
            String serverAddress = serverInfo.get("address");
            boolean connected = configReaderService.connectToServer(serverAddress);

            if (connected) {
                return ResponseEntity.ok().build();
            } else {
                return ResponseEntity.status(500).build();
            }
        } catch (Exception e) {
            log.error("Error connecting to server: {}", e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }
}
