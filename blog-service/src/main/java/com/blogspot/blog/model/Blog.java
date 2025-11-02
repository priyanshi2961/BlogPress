package com.blogspot.blog.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "blogs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Blog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(name = "author_id", nullable = false)
    private Long authorId;

    @Column(name = "author_username", nullable = false)
    private String authorUsername;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "is_published", nullable = false)
    @Builder.Default
    private Boolean isPublished = true;

    @ElementCollection
    @CollectionTable(name = "blog_images", joinColumns = @JoinColumn(name = "blog_id"))
    @Column(name = "image_url", columnDefinition = "TEXT")
    private List<String> imageUrls;

    // Engagement counts are now handled by engagement-service

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
