# Multi-stage build: build with Maven, run on Temurin JRE 24

FROM maven:3.9-eclipse-temurin-24 as builder
WORKDIR /build
COPY pom.xml .
COPY src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:24-jre
WORKDIR /app
COPY --from=builder /build/target/eureka-server-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8761
ENTRYPOINT ["java", "-jar", "app.jar"]
