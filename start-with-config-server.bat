@echo off
echo ========================================
echo  Blog Platform - Config Server Startup
echo ========================================
echo.

echo Step 1: Starting Config Server...
echo Please wait for Config Server to fully start before proceeding.
echo Config Server will be available at: http://localhost:8088
echo.
start "Config Server" cmd /k "cd /d config-server && .\mvnw.cmd spring-boot:run"

echo Waiting 30 seconds for Config Server to start...
timeout /t 30 /nobreak >nul

echo.
echo Step 2: Starting Eureka Server...
echo Eureka Server will be available at: http://localhost:8761
echo.
start "Eureka Server" cmd /k "cd /d eureka-server && .\mvnw.cmd spring-boot:run"

echo Waiting 20 seconds for Eureka Server to start...
timeout /t 20 /nobreak >nul

echo.
echo Step 3: Starting API Gateway...
echo API Gateway will be available at: http://localhost:8080
echo.
start "API Gateway" cmd /k "cd /d api-gateway && .\mvnw.cmd spring-boot:run"

echo Waiting 15 seconds for API Gateway to start...
timeout /t 15 /nobreak >nul

echo.
echo Step 4: Starting Microservices...
echo.
start "User Service" cmd /k "cd /d user-service && .\mvnw.cmd spring-boot:run"
start "Blog Service" cmd /k "cd /d blog-service && .\mvnw.cmd spring-boot:run"
start "Engagement Service" cmd /k "cd /d engagement-service && .\mvnw.cmd spring-boot:run"
start "Notification Service" cmd /k "cd /d notification-service && .\mvnw.cmd spring-boot:run"

echo.
echo ========================================
echo All services are starting up!
echo.
echo Service URLs:
echo - Config Server: http://localhost:8088
echo - Eureka Server: http://localhost:8761
echo - API Gateway: http://localhost:8080
echo - User Service: http://localhost:8081
echo - Blog Service: http://localhost:8082
echo - Engagement Service: http://localhost:8083
echo - Notification Service: http://localhost:8084
echo.
echo To test config server:
echo - http://localhost:8088/user-service/default
echo - http://localhost:8088/blog-service/default
echo - http://localhost:8088/engagement-service/default
echo - http://localhost:8088/notification-service/default
echo ========================================
