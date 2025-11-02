# Blog Service

A microservice for managing blog posts in the microservices-based blog application.

## Features

- **Blog CRUD Operations**: Create, read, update, and delete blog posts
- **Role-based Access Control**: Different permissions for users and admins
- **Image Support**: Blogs can contain multiple images
- **Search Functionality**: Search blogs by title and content
- **Pagination**: All list endpoints support pagination and sorting
- **View Count Tracking**: Automatic view count increment
- **Future-ready**: Properties for like and comment functionality

## Technology Stack

- **Spring Boot 3.5.4**
- **Spring Security** with JWT authentication
- **Spring Data JPA** with MySQL
- **Spring Cloud Netflix Eureka Client**
- **Spring Cloud OpenFeign** for service communication
- **Lombok** for reducing boilerplate code
- **MySQL** database

## Prerequisites

- Java 24
- MySQL 8.0+
- Maven 3.6+
- Running Eureka Server (port 8761)
- Running User Service (port 8081)

## Database Setup

Create a MySQL database named `blog_service_db`:

```sql
CREATE DATABASE blog_service_db;
```

## Configuration

The application uses the following configuration in `application.properties`:

- **Server Port**: 8082
- **Database**: MySQL on localhost:3306
- **Eureka Client**: Connects to Eureka Server on localhost:8761
- **File Upload**: Maximum 10MB per file

## API Endpoints

### Public Endpoints (No Authentication Required)

#### Get All Published Blogs

```
GET /api/blogs/public
```

Query Parameters:

- `page` (default: 0): Page number
- `size` (default: 10): Page size
- `sortBy` (default: createdAt): Sort field
- `sortDir` (default: desc): Sort direction (asc/desc)

#### Get Published Blog by ID

```
GET /api/blogs/public/{id}
```

#### Search Published Blogs

```
GET /api/blogs/public/search?keyword={keyword}
```

### Protected Endpoints (Authentication Required)

#### Create Blog

```
POST /api/blogs
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "title": "Blog Title",
  "content": "Blog content...",
  "imageUrls": ["url1", "url2"]
}
```

#### Get All Blogs (Admin sees all, Users see published only)

```
GET /api/blogs
Authorization: Bearer {jwt_token}
```

#### Get Blog by ID

```
GET /api/blogs/{id}
Authorization: Bearer {jwt_token}
```

#### Get Blogs by Author

```
GET /api/blogs/author/{authorId}
Authorization: Bearer {jwt_token}
```

#### Search Blogs

```
GET /api/blogs/search?keyword={keyword}
Authorization: Bearer {jwt_token}
```

#### Update Blog

```
PUT /api/blogs/{id}
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content...",
  "imageUrls": ["new_url1", "new_url2"],
  "isPublished": true
}
```

#### Delete Blog

```
DELETE /api/blogs/{id}
Authorization: Bearer {jwt_token}
```

## Authorization Rules

### User Role

- Can create blogs
- Can read all published blogs
- Can read, update, and delete only their own blogs
- Can search published blogs

### Admin Role

- Can perform all CRUD operations on any blog
- Can see all blogs (published and unpublished)
- Can search all blogs

## Service Communication

The blog service communicates with the user service using Spring Cloud OpenFeign to:

- Validate JWT tokens
- Get user information
- Check user roles and permissions

## Running the Application

1. Ensure MySQL is running and the database is created
2. Ensure Eureka Server is running on port 8761
3. Ensure User Service is running on port 8081
4. Run the application:

```bash
cd blog-service
./mvnw spring-boot:run
```

The service will start on port 8082 and register with Eureka Server.

## Database Schema

### Blogs Table

- `id`: Primary key
- `title`: Blog title
- `content`: Blog content (TEXT)
- `author_id`: ID of the blog author
- `author_username`: Username of the author
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp
- `is_published`: Publication status
- `like_count`: Number of likes (for future use)
- `comment_count`: Number of comments (for future use)
- `view_count`: Number of views

### Blog Images Table

- `blog_id`: Foreign key to blogs table
- `image_url`: URL of the image

## Future Enhancements

The blog service is designed to support future enhancements:

- Like functionality (like_count field)
- Comment functionality (comment_count field)
- Advanced search with filters
- Blog categories and tags
- Blog analytics and reporting
