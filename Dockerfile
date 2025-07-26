FROM eclipse-temurin:21-jdk

WORKDIR /app

COPY target/zk-dashboard-backend-1.0-SNAPSHOT.jar app.jar

EXPOSE 8085

ENTRYPOINT ["java", "-jar", "app.jar"]
