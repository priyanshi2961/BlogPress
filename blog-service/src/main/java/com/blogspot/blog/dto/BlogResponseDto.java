package com.blogspot.blog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlogResponseDto {
    private Long id;
    private String title;
    private String content;
    private String summary;
    private Long authorId;
    private String authorUsername;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean isPublished;
    private List<String> imageUrls;
    private Integer likeCount;
    private Integer commentCount;
    private Integer viewCount;
}
