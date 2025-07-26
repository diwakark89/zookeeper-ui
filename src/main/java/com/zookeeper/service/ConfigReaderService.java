package com.zookeeper.service;

import jakarta.annotation.PreDestroy;
import org.apache.curator.framework.CuratorFramework;
import org.apache.curator.framework.CuratorFrameworkFactory;
import org.apache.curator.retry.ExponentialBackoffRetry;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.concurrent.locks.ReentrantLock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class ConfigReaderService {
    private static final Logger log = LoggerFactory.getLogger(ConfigReaderService.class);

    public static final String ZK_PATH_DELIMITER = "/";
    public static final String DOT_SEPARATOR = ".";
    private CuratorFramework client;
    private String currentZookeeperServer;
    private final ReentrantLock connectionLock = new ReentrantLock();


    public ConfigReaderService(@Value("${zookeeper.server}")
                               String zooKeeperServer) {
        log.info("Initializing ZooKeeper client with server: {}", zooKeeperServer);
        this.currentZookeeperServer = zooKeeperServer;
        initializeClient(zooKeeperServer);
    }

    private void initializeClient(String zooKeeperServer) {
        // Create the client with more robust retry policy
        CuratorFramework newClient = CuratorFrameworkFactory.builder()
                .connectString(zooKeeperServer)
                .retryPolicy(new ExponentialBackoffRetry(1000, 5))
                .connectionTimeoutMs(5000)
                .sessionTimeoutMs(30000)
                .build();

        newClient.start();

        try {
            // Wait for connection to be established
            log.info("Waiting for ZooKeeper connection to {}", zooKeeperServer);
            if (!newClient.blockUntilConnected(10, java.util.concurrent.TimeUnit.SECONDS)) {
                log.error("Failed to connect to ZooKeeper within timeout period");
                throw new RuntimeException("Failed to connect to ZooKeeper server: " + zooKeeperServer);
            } else {
                log.info("Successfully connected to ZooKeeper at {}", zooKeeperServer);
                // Close previous client if it exists
                if (client != null) {
                    client.close();
                }
                client = newClient;
                currentZookeeperServer = zooKeeperServer;
            }
        } catch (InterruptedException e) {
            log.error("Connection to ZooKeeper was interrupted: {}", e.getMessage(), e);
            Thread.currentThread().interrupt();
            throw new RuntimeException("Connection to ZooKeeper was interrupted", e);
        }
    }

    public List<String> getTopLevelNodes() throws Exception {
        try {
            log.info("Attempting to get top level nodes from ZooKeeper");
            List<String> nodes = client.getChildren().forPath("/");
            log.info("Successfully retrieved {} top level nodes", nodes.size());
            return nodes;
        } catch (Exception e) {
            log.error("Error retrieving top level nodes: {}", e.getMessage(), e);
            throw e;
        }
    }

    public Map<String, String> getConfigMap(String parent) {
        Map<String, String> configs = new TreeMap<>();
        try {
            traverseZk(ZK_PATH_DELIMITER + parent, "", configs);
        } catch (Exception e) {
            throw new RuntimeException("Error reading from ZooKeeper", e);
        }
        log.info("Retrieved configs: {}", configs);
        return configs;
    }

    private void traverseZk(String parent, String prefix, Map<String, String> map) throws Exception {
        List<String> children = client.getChildren().forPath(parent);

        if (children.isEmpty()) {
            byte[] data = client.getData().forPath(parent);
            if (data != null && data.length > 0) {
                map.put(prefix, new String(data));
            }
            return;
        }

        for (String child : children) {
            String childPath = parent + ZK_PATH_DELIMITER + child;
            String newPrefix = prefix.isEmpty() ? child : prefix + DOT_SEPARATOR + child;
            traverseZk(childPath, newPrefix, map);
        }
    }

    public void writeToZookeeper(String parent, String key, String value) throws Exception {
        String zkPath = ZK_PATH_DELIMITER + parent + ZK_PATH_DELIMITER + key.replace(DOT_SEPARATOR, ZK_PATH_DELIMITER);
        String[] parts = zkPath.split(ZK_PATH_DELIMITER);
        StringBuilder path = new StringBuilder();
        for (int i = 1; i < parts.length; i++) {
            path.append(ZK_PATH_DELIMITER).append(parts[i]);
            if (client.checkExists().forPath(path.toString()) == null) {
                client.create().forPath(path.toString(), new byte[0]);
            }
        }
        client.setData().forPath(zkPath, value.getBytes());
    }

    public void deleteFromZookeeper(String parent, String key) throws Exception {
        String zkPath = ZK_PATH_DELIMITER + parent + ZK_PATH_DELIMITER + key.replace(DOT_SEPARATOR, ZK_PATH_DELIMITER);
        if (client.checkExists().forPath(zkPath) != null) {
            client.delete().deletingChildrenIfNeeded().forPath(zkPath);
            log.info("Deleted {}", zkPath);
        } else {
            log.info("Not able to delete {}", zkPath);
        }
    }

    /**
     * Connects to a new ZooKeeper server
     * 
     * @param serverAddress The address of the ZooKeeper server to connect to
     * @return true if connection was successful, false otherwise
     */
    public boolean connectToServer(String serverAddress) {
        try {
            connectionLock.lock();
            // Check if we're already connected to this server
            if (serverAddress.equals(currentZookeeperServer)) {
                return isConnected();
            }

            log.info("Connecting to new ZooKeeper server: {}", serverAddress);
            initializeClient(serverAddress);
            return true;
        } catch (Exception e) {
            log.error("Failed to connect to ZooKeeper server: {}", e.getMessage(), e);
            return false;
        } finally {
            connectionLock.unlock();
        }
    }

    /**
     * Checks if the client is connected to ZooKeeper
     * 
     * @return true if connected, false otherwise
     */
    public boolean isConnected() {
        return client != null && client.getZookeeperClient().isConnected();
    }

    /**
     * Gets the current ZooKeeper server address
     * 
     * @return The current server address
     */
    public String getCurrentServer() {
        return currentZookeeperServer;
    }

    @PreDestroy
    public void closeClient() {
        log.info("Closing ZooKeeper client connection");
        if (client != null) {
            client.close();
        }
    }

}
