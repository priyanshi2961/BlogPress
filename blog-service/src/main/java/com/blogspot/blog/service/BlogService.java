package com.blogspot.blog.service;

import com.blogspot.blog.dto.BlogCreateDto;
import com.blogspot.blog.dto.BlogResponseDto;
import com.blogspot.blog.dto.BlogUpdateDto;
import com.blogspot.blog.dto.UserDto;
import com.blogspot.blog.exception.BlogNotFoundException;
import com.blogspot.blog.exception.UnauthorizedAccessException;
import com.blogspot.blog.model.Blog;
import com.blogspot.blog.repository.BlogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Service
@RequiredArgsConstructor
@Slf4j
public class BlogService {

    private final BlogRepository blogRepository;
    private final UserServiceClient userServiceClient;
    private final EngagementServiceClient engagementServiceClient;
    private final NotificationPublisher notificationPublisher;

    /**
     * Helper method to format the Authorization header properly
     */
    private String formatAuthorizationHeader(String token) {
        if (token == null || token.trim().isEmpty()) {
            return null;
        }
        // Remove "Bearer " prefix if it exists, then add it back
        String cleanToken = token.trim();
        if (cleanToken.startsWith("Bearer ")) {
            cleanToken = cleanToken.substring(7);
        }
        return "Bearer " + cleanToken;
    }
    @Transactional(readOnly = true)
    public Blog findAnyById(Long id) {
        try {
            return blogRepository.findById(id).orElse(null);
        } catch (Exception e) {
            log.error("Error fetching blog by id {}: {}", id, e.getMessage());
            return null;
        }
    }

    @Transactional
    public BlogResponseDto createBlog(BlogCreateDto blogCreateDto, String token) {
        try {
            String authHeader = formatAuthorizationHeader(token);
            ResponseEntity<UserDto> userResponse = userServiceClient.getUserProfile(authHeader);
            if (userResponse.getStatusCode().is2xxSuccessful() && userResponse.getBody() != null) {
                UserDto user = userResponse.getBody();
                
                Blog blog = Blog.builder()
                        .title(blogCreateDto.getTitle())
                        .content(blogCreateDto.getContent())
                        .summary(blogCreateDto.getSummary())
                        .imageUrls(blogCreateDto.getImageUrls())
                        .authorId(user.getId())
                        .authorUsername(user.getUsername())
                        .isPublished(true)
                        // Engagement counts are handled by engagement-service
                        .build();

                Blog savedBlog = blogRepository.save(blog);
                
                // Fire-and-forget REST notification (idempotent, retried, circuit-breaker)
                try {
                    notificationPublisher.publishBlogCreated(
                            savedBlog.getId(),
                            savedBlog.getAuthorId(),
                            savedBlog.getTitle(),
                            savedBlog.getAuthorUsername()
                    );
                } catch (Exception ex) {
                    log.warn("Non-blocking failure scheduling REST notification for blog {}: {}", savedBlog.getId(), ex.getMessage());
                }
                
                return convertToResponseDto(savedBlog);
            } else {
                throw new UnauthorizedAccessException("Invalid token or user not found");
            }
        } catch (Exception e) {
            log.error("Error creating blog: {}", e.getMessage());
            throw new UnauthorizedAccessException("Failed to create blog: " + e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public Page<BlogResponseDto> getAllPublishedBlogs(Pageable pageable) {
        Page<Blog> blogs = blogRepository.findByIsPublishedTrue(pageable);
        return blogs.map(this::convertToResponseDto);
    }

    @Transactional(readOnly = true)
    public Page<BlogResponseDto> getAllBlogs(Pageable pageable, String token) {
        try {
            String authHeader = formatAuthorizationHeader(token);
            ResponseEntity<UserDto> userResponse = userServiceClient.getUserProfile(authHeader);
            if (userResponse.getStatusCode().is2xxSuccessful() && userResponse.getBody() != null) {
                UserDto user = userResponse.getBody();
                if ("ADMIN".equals(user.getRole())) {
                    // Admin can see all blogs (published and unpublished)
                    Page<Blog> blogs = blogRepository.findAll(pageable);
                    return blogs.map(this::convertToResponseDto);
                } else {
                    // Normal users can only see published blogs
                    return getAllPublishedBlogs(pageable);
                }
            }
            return getAllPublishedBlogs(pageable);
        } catch (Exception e) {
            log.error("Error fetching blogs: {}", e.getMessage());
            return getAllPublishedBlogs(pageable);
        }
    }

    @Transactional(readOnly = true)
    public BlogResponseDto getBlogById(Long id, String token) {
        Blog blog;
        try {
            String authHeader = formatAuthorizationHeader(token);
            ResponseEntity<UserDto> userResponse = userServiceClient.getUserProfile(authHeader);
            if (userResponse.getStatusCode().is2xxSuccessful() && userResponse.getBody() != null) {
                UserDto user = userResponse.getBody();
                if ("ADMIN".equals(user.getRole())) {
                    // Admin can see any blog (published or unpublished)
                    blog = blogRepository.findById(id)
                            .orElseThrow(() -> new BlogNotFoundException(id));
                } else {
                    // Normal users can only see published blogs
                    blog = blogRepository.findByIdAndIsPublishedTrue(id)
                            .orElseThrow(() -> new BlogNotFoundException(id));
                }
            } else {
                // No token or invalid token - only show published blogs
                blog = blogRepository.findByIdAndIsPublishedTrue(id)
                        .orElseThrow(() -> new BlogNotFoundException(id));
            }
            
            // View count is now handled by engagement-service
            
            return convertToResponseDto(blog);
        } catch (BlogNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching blog: {}", e.getMessage());
            throw new BlogNotFoundException(id);
        }
    }

    @Transactional(readOnly = true)
    public Page<BlogResponseDto> getBlogsByAuthor(Long authorId, Pageable pageable, String token) {
        try {
            String authHeader = formatAuthorizationHeader(token);
            ResponseEntity<UserDto> userResponse = userServiceClient.getUserProfile(authHeader);
            if (userResponse.getStatusCode().is2xxSuccessful() && userResponse.getBody() != null) {
                UserDto user = userResponse.getBody();
                if ("ADMIN".equals(user.getRole()) || user.getId().equals(authorId)) {
                    // Admin can see all blogs by any author, users can see all their own blogs
                    Page<Blog> blogs = blogRepository.findByAuthorId(authorId, pageable);
                    return blogs.map(this::convertToResponseDto);
                } else {
                    // Other users can only see published blogs by this author
                    Page<Blog> blogs = blogRepository.findByAuthorIdAndIsPublishedTrue(authorId, pageable);
                    return blogs.map(this::convertToResponseDto);
                }
            }
            // No token - only show published blogs
            Page<Blog> blogs = blogRepository.findByAuthorIdAndIsPublishedTrue(authorId, pageable);
            return blogs.map(this::convertToResponseDto);
        } catch (Exception e) {
            log.error("Error fetching blogs by author: {}", e.getMessage());
            Page<Blog> blogs = blogRepository.findByAuthorIdAndIsPublishedTrue(authorId, pageable);
            return blogs.map(this::convertToResponseDto);
        }
    }

    @Transactional(readOnly = true)
    public Page<BlogResponseDto> searchBlogs(String keyword, Pageable pageable, String token) {
        try {
            String authHeader = formatAuthorizationHeader(token);
            ResponseEntity<UserDto> userResponse = userServiceClient.getUserProfile(authHeader);
            if (userResponse.getStatusCode().is2xxSuccessful() && userResponse.getBody() != null) {
                UserDto user = userResponse.getBody();
                if ("ADMIN".equals(user.getRole())) {
                    // Admin can search all blogs
                    Page<Blog> blogs = blogRepository.findByTitleContainingOrContentContaining(keyword, keyword, pageable);
                    return blogs.map(this::convertToResponseDto);
                } else {
                    // Normal users can only search published blogs
                    Page<Blog> blogs = blogRepository.findByTitleContainingOrContentContainingAndIsPublishedTrue(keyword, keyword, pageable);
                    return blogs.map(this::convertToResponseDto);
                }
            }
            // No token - only search published blogs
            Page<Blog> blogs = blogRepository.findByTitleContainingOrContentContainingAndIsPublishedTrue(keyword, keyword, pageable);
            return blogs.map(this::convertToResponseDto);
        } catch (Exception e) {
            log.error("Error searching blogs: {}", e.getMessage());
            Page<Blog> blogs = blogRepository.findByTitleContainingOrContentContainingAndIsPublishedTrue(keyword, keyword, pageable);
            return blogs.map(this::convertToResponseDto);
        }
    }

    @Transactional
    public BlogResponseDto updateBlog(Long id, BlogUpdateDto blogUpdateDto, String token) {
        try {
            String authHeader = formatAuthorizationHeader(token);
            ResponseEntity<UserDto> userResponse = userServiceClient.getUserProfile(authHeader);
            if (userResponse.getStatusCode().is2xxSuccessful() && userResponse.getBody() != null) {
                UserDto user = userResponse.getBody();
                
                Blog blog = blogRepository.findById(id)
                        .orElseThrow(() -> new BlogNotFoundException(id));
                
                // Authorization check: Only admin or the blog author can update
                if (!"ADMIN".equals(user.getRole()) && !blog.getAuthorId().equals(user.getId())) {
                    throw new UnauthorizedAccessException("You can only update your own blogs");
                }
                
                // Update fields if provided
                if (blogUpdateDto.getTitle() != null) {
                    blog.setTitle(blogUpdateDto.getTitle());
                }
                if (blogUpdateDto.getContent() != null) {
                    blog.setContent(blogUpdateDto.getContent());
                }
                if (blogUpdateDto.getSummary() != null) {
                    blog.setSummary(blogUpdateDto.getSummary());
                }
                if (blogUpdateDto.getImageUrls() != null) {
                    blog.setImageUrls(blogUpdateDto.getImageUrls());
                }
                if (blogUpdateDto.getIsPublished() != null) {
                    // Only admin can change publish status
                    if ("ADMIN".equals(user.getRole())) {
                        blog.setIsPublished(blogUpdateDto.getIsPublished());
                    }
                }
                
                Blog updatedBlog = blogRepository.save(blog);
                return convertToResponseDto(updatedBlog);
            } else {
                throw new UnauthorizedAccessException("Invalid token or user not found");
            }
        } catch (UnauthorizedAccessException | BlogNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error updating blog: {}", e.getMessage());
            throw new UnauthorizedAccessException("Failed to update blog: " + e.getMessage());
        }
    }

    @Transactional
    public void deleteBlog(Long id, String token) {
        try {
            String authHeader = formatAuthorizationHeader(token);
            ResponseEntity<UserDto> userResponse = userServiceClient.getUserProfile(authHeader);
            if (userResponse.getStatusCode().is2xxSuccessful() && userResponse.getBody() != null) {
                UserDto user = userResponse.getBody();
                
                Blog blog = blogRepository.findById(id)
                        .orElseThrow(() -> new BlogNotFoundException(id));
                
                // Authorization check: Only admin or the blog author can delete
                if (!"ADMIN".equals(user.getRole()) && !blog.getAuthorId().equals(user.getId())) {
                    throw new UnauthorizedAccessException("You can only delete your own blogs");
                }
                
                blogRepository.delete(blog);
            } else {
                throw new UnauthorizedAccessException("Invalid token or user not found");
            }
        } catch (UnauthorizedAccessException | BlogNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error deleting blog: {}", e.getMessage());
            throw new UnauthorizedAccessException("Failed to delete blog: " + e.getMessage());
        }
    }

    private BlogResponseDto convertToResponseDto(Blog blog) {
        try {
            // Fetch engagement counts from engagement-service
            Long likeCount = engagementServiceClient.getLikeCount(blog.getId());
            Long viewCount = engagementServiceClient.getViewCount(blog.getId());
            Long commentCount = engagementServiceClient.getCommentCount(blog.getId());
            
            return BlogResponseDto.builder()
                    .id(blog.getId())
                    .title(blog.getTitle())
                    .content(blog.getContent())
                    .summary(blog.getSummary())
                    .authorId(blog.getAuthorId())
                    .authorUsername(blog.getAuthorUsername())
                    .createdAt(blog.getCreatedAt())
                    .updatedAt(blog.getUpdatedAt())
                    .isPublished(blog.getIsPublished())
                    .imageUrls(blog.getImageUrls())
                    .likeCount(likeCount != null ? likeCount.intValue() : 0)
                    .viewCount(viewCount != null ? viewCount.intValue() : 0)
                    .commentCount(commentCount != null ? commentCount.intValue() : 0)
                    .build();
        } catch (Exception e) {
            log.warn("Failed to fetch engagement counts for blog {}: {}", blog.getId(), e.getMessage());
            // Return blog without engagement counts if engagement-service is unavailable
            return BlogResponseDto.builder()
                    .id(blog.getId())
                    .title(blog.getTitle())
                    .content(blog.getContent())
                    .summary(blog.getSummary())
                    .authorId(blog.getAuthorId())
                    .authorUsername(blog.getAuthorUsername())
                    .createdAt(blog.getCreatedAt())
                    .updatedAt(blog.getUpdatedAt())
                    .isPublished(blog.getIsPublished())
                    .imageUrls(blog.getImageUrls())
                    .likeCount(0)
                    .viewCount(0)
                    .commentCount(0)
                    .build();
        }
    }
}
