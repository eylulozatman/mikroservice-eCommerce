FROM docker.io/library/maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

FROM docker.io/library/eclipse-temurin:17-jre
WORKDIR /app
COPY --from=builder /app/target/product-service-1.0.0.jar /app/app.jar
EXPOSE 3001
ENTRYPOINT ["java", "-jar", "/app/app.jar"]