package com.blogspot.blog.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlogUpdateDto {
    
    @Size(min = 1, max = 255, message = "Title must be between 1 and 255 characters")
    private String title;
    
    @Size(min = 1, message = "Content cannot be empty")
    private String content;
    
    private String summary;
    
    private List<String> imageUrls;
    private Boolean isPublished;
}
