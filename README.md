# ZooKeeper Dashboard

A modern web-based UI to manage and visualize your configuration in Apache ZooKeeper. This application provides an intuitive interface for viewing, editing, and managing ZooKeeper nodes and their data.

## Features

- Browse and navigate ZooKeeper node hierarchy
- View and edit node data
- Create and delete nodes
- Connect to different ZooKeeper servers
- Multi-server support

## Technology Stack

### Backend
- Java 21
- Spring Boot 3.4.4
- Apache Curator Framework 5.5.0 (ZooKeeper client)
- SLF4J for logging

### Frontend
- Bootstrap 5.3.2
- Modern JavaScript
- Responsive design

## Getting Started

### Prerequisites
- Java 21 or later
- Maven
- Running ZooKeeper server

### Configuration
The application can be configured through `application.properties` with the following properties:

```properties
# ZooKeeper connection settings
zookeeper.server=localhost:2181
# List of available ZooKeeper servers
zookeeper.servers=[{"name":"Local","address":"localhost:2181"},{"name":"Production","address":"prod-zk:2181"}]
# Server port
server.port=8085
```

### Build and Run

```bash
# Build the application
mvn clean package

# Run the application
java -jar target/zk-dashboard-backend-1.0-SNAPSHOT.jar
```

### Docker
A Dockerfile is provided to build and run the application in a container:

```bash
# Build Docker image
docker build -t zookeeper-dashboard:latest .

# Run Docker container
docker run -p 8085:8085 zookeeper-dashboard:latest
```

## API Endpoints

- `GET /config?parent={parentNode}` - Get configuration for a specific parent node
- `GET /config/parent` - Get top-level nodes
- `PUT /config?parent={parentNode}` - Update configuration
- `DELETE /config/{key}?parent={parentNode}` - Delete configuration
- `GET /servers` - Get list of available ZooKeeper servers
- `GET /servers/current` - Get current connected server
- `PUT /servers/connect` - Connect to a different server

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
