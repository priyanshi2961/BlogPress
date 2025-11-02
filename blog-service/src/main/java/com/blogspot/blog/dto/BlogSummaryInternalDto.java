package com.blogspot.blog.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BlogSummaryInternalDto {
    private Long id;
    private String title;
    private Long authorId;
}


