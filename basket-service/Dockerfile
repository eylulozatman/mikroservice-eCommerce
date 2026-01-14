FROM docker.io/library/maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

FROM docker.io/library/eclipse-temurin:17-jre
WORKDIR /app
COPY --from=builder /app/target/basket-service-0.0.1-SNAPSHOT.jar /app/app.jar
EXPOSE 3002
CMD ["java", "-jar", "app.jar"]