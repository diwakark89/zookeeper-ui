package com.zookeeper.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Configuration
@ConfigurationProperties(prefix = "zookeeper")
public class ZookeeperConfig {
    private String server;
    private List<Map<String, String>> servers = new ArrayList<>();
    private String rootConfig;

    public String getServer() {
        return server;
    }

    public void setServer(String server) {
        this.server = server;
    }

    public List<Map<String, String>> getServers() {
        return servers;
    }

    public void setServers(List<Map<String, String>> servers) {
        this.servers = servers;
    }

    public String getRootConfig() {
        return rootConfig;
    }

    public void setRootConfig(String rootConfig) {
        this.rootConfig = rootConfig;
    }
}
