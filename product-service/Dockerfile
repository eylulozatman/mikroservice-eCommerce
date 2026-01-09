# ---------- BUILD STAGE ----------
FROM maven:3.9.12-eclipse-temurin-17 AS build
WORKDIR /app

# Maven dependency cache için önce pom
COPY pom.xml .
RUN mvn -q -DskipTests dependency:go-offline

# Sonra kaynak kod
COPY src ./src

# Jar üret
RUN mvn -q -DskipTests clean package


# ---------- RUNTIME STAGE ----------
FROM eclipse-temurin:17-jre
WORKDIR /app

# build stage'den jar'ı kopyala
COPY --from=build /app/target/*.jar app.jar

# Product service portu
EXPOSE 3001

# Uygulamayı başlat
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
