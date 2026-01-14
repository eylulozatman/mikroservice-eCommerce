FROM eclipse-temurin:17-jre
WORKDIR /app

COPY target/product-service-1.0.0.jar /app/app.jar

EXPOSE 3001
ENTRYPOINT ["java","-jar","/app/app.jar"]
