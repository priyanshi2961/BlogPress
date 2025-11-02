package com.blogspot.engagement.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "views", indexes = {
    @Index(name = "idx_views_blog", columnList = "blog_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ViewEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "blog_id", nullable = false)
    private Long blogId;

    @Column(name = "username")
    private String username; // nullable: allow anonymous views

    @Column(name = "ip_address")
    private String ipAddress; // optional to deduplicate if needed

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}


