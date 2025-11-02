package com.blogspot.blog.controller;

import com.blogspot.blog.dto.BlogCreateDto;
import com.blogspot.blog.dto.BlogResponseDto;
import com.blogspot.blog.dto.BlogUpdateDto;
import com.blogspot.blog.exception.BlogNotFoundException;
import com.blogspot.blog.exception.UnauthorizedAccessException;
import com.blogspot.blog.service.BlogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import com.blogspot.blog.dto.BlogSummaryInternalDto;

@RestController
@RequestMapping("/api/blogs")
@RequiredArgsConstructor
@Slf4j
public class BlogController {

    private final BlogService blogService;

    @PostMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<BlogResponseDto> createBlog(
            @Valid @RequestBody BlogCreateDto blogCreateDto,
            @RequestHeader("Authorization") String token) {
        try {
            BlogResponseDto createdBlog = blogService.createBlog(blogCreateDto, token);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdBlog);
        } catch (UnauthorizedAccessException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (Exception e) {
            log.error("Error creating blog: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/public")
    public ResponseEntity<Page<BlogResponseDto>> getAllPublishedBlogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        try {
            Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
            Pageable pageable = PageRequest.of(page, size, sort);
            Page<BlogResponseDto> blogs = blogService.getAllPublishedBlogs(pageable);
            return ResponseEntity.ok(blogs);
        } catch (Exception e) {
            log.error("Error fetching published blogs: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<Page<BlogResponseDto>> getAllBlogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestHeader("Authorization") String token) {
        try {
            Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
            Pageable pageable = PageRequest.of(page, size, sort);
            Page<BlogResponseDto> blogs = blogService.getAllBlogs(pageable, token);
            return ResponseEntity.ok(blogs);
        } catch (Exception e) {
            log.error("Error fetching blogs: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/public/{id}")
    public ResponseEntity<BlogResponseDto> getPublishedBlogById(@PathVariable Long id) {
        try {
            BlogResponseDto blog = blogService.getBlogById(id, null);
            return ResponseEntity.ok(blog);
        } catch (BlogNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error fetching published blog: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/internal/{id}")
    public ResponseEntity<BlogSummaryInternalDto> getBlogSummaryInternal(@PathVariable Long id) {
        try {
            var blog = blogService.findAnyById(id);
            if (blog == null) {
                return ResponseEntity.notFound().build();
            }
            BlogSummaryInternalDto dto = BlogSummaryInternalDto.builder()
                    .id(blog.getId())
                    .title(blog.getTitle())
                    .authorId(blog.getAuthorId())
                    .build();
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            log.error("Error fetching internal blog summary: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<BlogResponseDto> getBlogById(
            @PathVariable Long id,
            @RequestHeader("Authorization") String token) {
        try {
            BlogResponseDto blog = blogService.getBlogById(id, token);
            return ResponseEntity.ok(blog);
        } catch (BlogNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error fetching blog: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/author/{authorId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<Page<BlogResponseDto>> getBlogsByAuthor(
            @PathVariable Long authorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestHeader("Authorization") String token) {
        try {
            Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
            Pageable pageable = PageRequest.of(page, size, sort);
            Page<BlogResponseDto> blogs = blogService.getBlogsByAuthor(authorId, pageable, token);
            return ResponseEntity.ok(blogs);
        } catch (Exception e) {
            log.error("Error fetching blogs by author: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<Page<BlogResponseDto>> searchBlogs(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestHeader("Authorization") String token) {
        try {
            Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
            Pageable pageable = PageRequest.of(page, size, sort);
            Page<BlogResponseDto> blogs = blogService.searchBlogs(keyword, pageable, token);
            return ResponseEntity.ok(blogs);
        } catch (Exception e) {
            log.error("Error searching blogs: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/public/search")
    public ResponseEntity<Page<BlogResponseDto>> searchPublishedBlogs(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        try {
            Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
            Pageable pageable = PageRequest.of(page, size, sort);
            Page<BlogResponseDto> blogs = blogService.searchBlogs(keyword, pageable, null);
            return ResponseEntity.ok(blogs);
        } catch (Exception e) {
            log.error("Error searching published blogs: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<BlogResponseDto> updateBlog(
            @PathVariable Long id,
            @Valid @RequestBody BlogUpdateDto blogUpdateDto,
            @RequestHeader("Authorization") String token) {
        try {
            BlogResponseDto updatedBlog = blogService.updateBlog(id, blogUpdateDto, token);
            return ResponseEntity.ok(updatedBlog);
        } catch (BlogNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (UnauthorizedAccessException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            log.error("Error updating blog: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<Void> deleteBlog(
            @PathVariable Long id,
            @RequestHeader("Authorization") String token) {
        try {
            blogService.deleteBlog(id, token);
            return ResponseEntity.noContent().build();
        } catch (BlogNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (UnauthorizedAccessException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            log.error("Error deleting blog: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
