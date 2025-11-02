package com.blogspot.engagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class CommentDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateCommentRequest {
        @NotNull
        private Long blogId;
        @NotBlank
        private String content;
        private Long parentId; // optional
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateCommentRequest {
        @NotBlank
        private String content;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CommentResponse {
        private Long id;
        private Long blogId;
        private String username;
        private String content;
        private Long parentId;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        @Builder.Default
        private List<CommentResponse> replies = new ArrayList<>();
    }
}


