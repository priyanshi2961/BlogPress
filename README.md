# Blog Platform - Microservices Architecture

A modern, scalable blog platform built with microservices architecture using Spring Boot, Spring Cloud, and React.

## 🏗️ Architecture Overview

This project implements a microservices architecture with the following components:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │   API Gateway   │    │  Eureka Server  │
│    (Port 5173)  │◄──►│   (Port 8084)   │◄──►│   (Port 8761)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
        │ User Service │ │ Blog Service│ │ Engagement │
        │ (Port 8081)  │ │ (Port 8082) │ │   Service  │
        └──────────────┘ └─────────────┘ │ (Port 8083)│
                                         └────────────┘
                                │
                        ┌───────▼──────┐
                        │ Notification │
                        │   Service    │
                        │ (Port 8085)  │
                        └──────────────┘
```

## 🚀 Services

### 1. **Eureka Server** (Port 8761)

- **Purpose**: Service discovery and registration
- **Technology**: Spring Cloud Netflix Eureka
- **Features**:
  - Service registry for all microservices
  - Health monitoring and load balancing
  - Automatic service discovery

### 2. **API Gateway** (Port 8084)

- **Purpose**: Single entry point for all client requests
- **Technology**: Spring Cloud Gateway
- **Features**:
  - Request routing to appropriate microservices
  - JWT authentication and authorization
  - CORS configuration
  - Rate limiting and security filters

### 3. **User Service** (Port 8081)

- **Purpose**: User management and authentication
- **Technology**: Spring Boot, Spring Security, JPA
- **Features**:
  - User registration and login
  - JWT token generation and validation
  - User profile management
  - Role-based access control

### 4. **Blog Service** (Port 8082)

- **Purpose**: Blog content management
- **Technology**: Spring Boot, Spring Data JPA
- **Features**:
  - Create, read, update, delete blog posts
  - Blog categorization and tagging
  - Content validation and sanitization
  - Author-based blog management

### 5. **Engagement Service** (Port 8083)

- **Purpose**: User interactions with blog content
- **Technology**: Spring Boot, Spring Data JPA
- **Features**:
  - **Comments**: Nested commenting system with up to 5 levels deep
  - **Likes**: Toggle like/unlike functionality
  - **Views**: Anonymous and authenticated view tracking
  - Real-time engagement statistics

### 6. **Notification Service** (Port 8085)

- **Purpose**: Email notifications and event-driven messaging
- **Technology**: Spring Boot, Spring Mail, Apache Kafka
- **Features**:
  - **Email Notifications**: Automated email sending via Gmail SMTP
  - **Event Processing**: Kafka consumer for real-time event handling
  - **Blog Notifications**: New blog post alerts to followers
  - **Engagement Alerts**: Milestone notifications (likes, comments, views)
  - **User Registration**: Welcome emails for new users
  - **Configurable Templates**: Customizable email templates
  - **Rate Limiting**: Configurable email sending limits
  - **Health Monitoring**: Comprehensive health checks and metrics

### 7. **Frontend Application** (Port 5173)

- **Purpose**: User interface for the blog platform
- **Technology**: React 19, Vite, TailwindCSS
- **Features**:
  - Responsive modern UI design
  - User authentication and registration
  - Blog creation and management
  - Interactive comment system with nested replies
  - Real-time engagement features
  - Admin dashboard

## 🛠️ Technology Stack

### Backend

- **Framework**: Spring Boot 3.5.4
- **Cloud**: Spring Cloud 2025.0.0
- **Database**: MySQL
- **Security**: Spring Security + JWT
- **Service Discovery**: Netflix Eureka
- **API Gateway**: Spring Cloud Gateway
- **Configuration Management**: Spring Cloud Config Server
- **Message Queue**: Apache Kafka
- **Email Service**: Spring Mail (Gmail SMTP)
- **Build Tool**: Maven
- **Java Version**: 24

### Frontend

- **Framework**: React 19.1.1
- **Build Tool**: Vite 7.1.0
- **Styling**: TailwindCSS 4.1.11
- **HTTP Client**: Axios 1.11.0
- **Routing**: React Router DOM 7.8.0
- **Form Handling**: React Hook Form 7.62.0
- **Validation**: Zod 4.0.17
- **Icons**: Lucide React 0.539.0

## 📋 Prerequisites

- **Java 24** or higher
- **Node.js 18** or higher
- **MySQL 8.0** or higher
- **Maven 3.8** or higher
- **Apache Kafka** (for notification service)
- **Git**

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd MSA/project
```

### 2. Database Setup

Create MySQL databases for each service:

```sql
CREATE DATABASE user_service_db;
CREATE DATABASE blog_service_db;
CREATE DATABASE engagement_service_db;
```

### 3. Start Apache Kafka (Required for Notification Service)

```bash
# Start Zookeeper
bin/zookeeper-server-start.sh config/zookeeper.properties

# Start Kafka Server
bin/kafka-server-start.sh config/server.properties
```

### 4. Start Services (Recommended Order)

#### Step 1: Start Eureka Server

```bash
cd eureka-server
mvn spring-boot:run
```

Wait for Eureka to start completely (check http://localhost:8761)

#### Step 2: Start API Gateway

```bash
cd api-gateway
mvn spring-boot:run
```

#### Step 3: Start Microservices (can be started in parallel)

```bash
# Terminal 1
cd user-service
mvn spring-boot:run

# Terminal 2
cd blog-service
mvn spring-boot:run

# Terminal 3
cd engagement-service
mvn spring-boot:run

# Terminal 4
cd notification-service
mvn spring-boot:run
```

#### Step 4: Start Frontend

```bash
cd blog-frontend
npm install
npm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **API Gateway**: http://localhost:8084
- **Eureka Dashboard**: http://localhost:8761
- **Notification Service**: http://localhost:8085

## 🔧 Configuration

### Environment Variables

Each service can be configured using the following environment variables:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=<service_db_name>
DB_USERNAME=root
DB_PASSWORD=<your_password>

# JWT Configuration
JWT_SECRET=<your_jwt_secret>
JWT_EXPIRATION=86400000

# Service Ports
EUREKA_PORT=8761
GATEWAY_PORT=8084
USER_SERVICE_PORT=8081
BLOG_SERVICE_PORT=8082
ENGAGEMENT_SERVICE_PORT=8083
NOTIFICATION_SERVICE_PORT=8085

# Email Configuration (for Notification Service)
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# Kafka Configuration
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
```

### Application Properties

Key configuration files:

- `eureka-server/src/main/resources/application.properties`
- `api-gateway/src/main/resources/application.properties`
- `user-service/src/main/resources/application.properties`
- `blog-service/src/main/resources/application.properties`
- `engagement-service/src/main/resources/application.properties`
- `notification-service/src/main/resources/application.properties`
- `config-server/src/main/resources/application.properties`

## 📚 API Documentation

### Authentication Endpoints

```
POST /auth/register - User registration
POST /auth/login    - User login
GET  /auth/profile  - Get user profile
```

### Blog Endpoints

```
GET    /blogs              - Get all blogs (paginated)
POST   /blogs              - Create new blog
GET    /blogs/{id}         - Get blog by ID
PUT    /blogs/{id}         - Update blog
DELETE /blogs/{id}         - Delete blog
GET    /blogs/user/{userId} - Get blogs by user
```

### Engagement Endpoints

```
# Comments
POST   /blogs/{id}/comments           - Add comment
GET    /public/blogs/{id}/comments    - Get comments
PUT    /blogs/{id}/comments/{commentId} - Update comment
DELETE /blogs/{id}/comments/{commentId} - Delete comment

# Likes
POST   /blogs/{id}/likes/toggle       - Toggle like
GET    /blogs/{id}/likes/status       - Get like status
GET    /public/blogs/{id}/likes/count - Get like count

# Views
POST   /public/blogs/{id}/views       - Record view
GET    /public/blogs/{id}/views/count - Get view count
```

### Notification Endpoints

```
# Health and Status
GET    /actuator/health              - Service health check
GET    /actuator/info                - Service information
GET    /actuator/metrics             - Service metrics

# Email Notifications (Internal)
POST   /notifications/blog-created   - Send new blog notification
POST   /notifications/milestone      - Send engagement milestone notification
POST   /notifications/user-welcome   - Send user registration welcome email
```

## 🎨 Frontend Features

### User Interface

- **Responsive Design**: Mobile-first approach with TailwindCSS
- **Modern UI Components**: Clean, intuitive interface
- **Dark/Light Theme**: User preference support
- **Real-time Updates**: Live engagement statistics

### Key Components

- **Authentication**: Login/Register forms with validation
- **Blog Management**: Create, edit, delete blog posts
- **Comment System**: Nested comments with visual hierarchy
- **User Dashboard**: Personal blog management
- **Admin Panel**: System administration features

### Comment System Features

- **Nested Structure**: Up to 5 levels of comment depth
- **Visual Indicators**: Color-coded depth levels
- **User Avatars**: Generated gradient avatars
- **Real-time Validation**: Character limits and content validation
- **Responsive Actions**: Reply, edit, delete functionality

## 🔒 Security Features

- **JWT Authentication**: Stateless authentication across services
- **Role-based Access Control**: User and admin roles
- **CORS Configuration**: Proper cross-origin resource sharing
- **Input Validation**: Comprehensive request validation
- **SQL Injection Protection**: JPA and parameterized queries

## 🐛 Troubleshooting

### Common Issues

#### 1. Service Discovery Issues

If services can't find each other:

```bash
# Check Eureka dashboard at http://localhost:8761
# Ensure all services are registered
# Verify hostname configuration in application.properties
```

#### 2. Database Connection Issues

```bash
# Verify MySQL is running
# Check database credentials in application.properties
# Ensure databases are created
```

#### 3. CORS Issues

```bash
# Check API Gateway CORS configuration
# Verify frontend is making requests to gateway (port 8084)
# Check browser developer tools for CORS errors
```

#### 4. Port Conflicts

```bash
# Check if ports are already in use
netstat -an | findstr :8761
netstat -an | findstr :8084
netstat -an | findstr :8085
# etc.
```

#### 5. Notification Service Issues

```bash
# Check if Kafka is running
# Verify email configuration (MAIL_USERNAME, MAIL_PASSWORD)
# Check notification service logs for email sending errors
# Verify Gmail app password is correct
```

## 📈 Monitoring and Health Checks

All services include Spring Boot Actuator for monitoring:

- **Health**: `/actuator/health`
- **Info**: `/actuator/info`
- **Metrics**: `/actuator/metrics`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Spring Boot and Spring Cloud communities
- React and Vite development teams
- TailwindCSS for the amazing styling framework
- All contributors and maintainers

---

**Note**: This project demonstrates modern microservices architecture patterns and is suitable for learning and production use with proper security configurations.
