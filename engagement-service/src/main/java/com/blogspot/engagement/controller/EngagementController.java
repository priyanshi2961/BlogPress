package com.blogspot.engagement.controller;

import com.blogspot.engagement.dto.CommentDtos.CommentResponse;
import com.blogspot.engagement.dto.CommentDtos.CreateCommentRequest;
import com.blogspot.engagement.dto.CommentDtos.UpdateCommentRequest;
import com.blogspot.engagement.service.EngagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/engagement")
@RequiredArgsConstructor
public class EngagementController {

    private final EngagementService engagementService;

    // Likes
    @PostMapping("/blogs/{blogId}/likes")
    public ResponseEntity<?> likeBlog(@PathVariable Long blogId) {
        String username = extractUsername();
        boolean created = engagementService.likeBlog(blogId, username);
        return created ? ResponseEntity.ok().build() : ResponseEntity.noContent().build();
    }

    @DeleteMapping("/blogs/{blogId}/likes")
    public ResponseEntity<?> unlikeBlog(@PathVariable Long blogId) {
        String username = extractUsername();
        boolean removed = engagementService.unlikeBlog(blogId, username);
        return removed ? ResponseEntity.ok().build() : ResponseEntity.noContent().build();
    }

    @PostMapping("/blogs/{blogId}/likes/toggle")
    public ResponseEntity<Boolean> toggleLike(@PathVariable Long blogId) {
        try {
            String username = extractUsername();
            System.out.println("DEBUG: Toggle like for blog " + blogId + " by user " + username);
            boolean isLiked = engagementService.toggleLike(blogId, username);
            return ResponseEntity.ok(isLiked);
        } catch (Exception e) {
            System.err.println("ERROR: Failed to toggle like: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @GetMapping("/blogs/{blogId}/likes/status")
    public ResponseEntity<Boolean> isLiked(@PathVariable Long blogId) {
        String username = extractUsername();
        boolean isLiked = engagementService.isLiked(blogId, username);
        return ResponseEntity.ok(isLiked);
    }

    @GetMapping("/public/blogs/{blogId}/likes/count")
    public ResponseEntity<Long> getLikes(@PathVariable Long blogId) {
        return ResponseEntity.ok(engagementService.getLikeCount(blogId));
    }

    // Views
    @PostMapping("/public/blogs/{blogId}/views")
    public ResponseEntity<?> recordView(@PathVariable Long blogId, @RequestHeader(value = "X-Forwarded-For", required = false) String xff,
                                        @RequestHeader(value = "X-Real-IP", required = false) String xri,
                                        @RequestHeader(value = "X-Username", required = false) String usernameHeader) {
        String username = usernameHeader != null ? usernameHeader : extractUsernameNullable();
        String ip = xff != null ? xff : xri;
        engagementService.recordView(blogId, username, ip);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/public/blogs/{blogId}/views/count")
    public ResponseEntity<Long> getViews(@PathVariable Long blogId) {
        return ResponseEntity.ok(engagementService.getViewCount(blogId));
    }

    // Comments
    @PostMapping("/blogs/{blogId}/comments")
    public ResponseEntity<CommentResponse> addComment(@PathVariable Long blogId, @Valid @RequestBody CreateCommentRequest request) {
        try {
            String username = extractUsername();
            System.out.println("DEBUG: Add comment for blog " + blogId + " by user " + username);
            request.setBlogId(blogId);
            return ResponseEntity.ok(engagementService.addComment(username, request));
        } catch (Exception e) {
            System.err.println("ERROR: Failed to add comment: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @PutMapping("/blogs/{blogId}/comments/{commentId}")
    public ResponseEntity<CommentResponse> updateComment(@PathVariable Long blogId, @PathVariable Long commentId,
                                                         @Valid @RequestBody UpdateCommentRequest request) {
        String username = extractUsername();
        return ResponseEntity.ok(engagementService.updateComment(commentId, username, request));
    }

    @DeleteMapping("/blogs/{blogId}/comments/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable Long blogId, @PathVariable Long commentId) {
        String username = extractUsername();
        engagementService.deleteComment(commentId, username);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/public/blogs/{blogId}/comments")
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable Long blogId) {
        return ResponseEntity.ok(engagementService.getCommentsTree(blogId));
    }

    @GetMapping("/public/blogs/{blogId}/comments/count")
    public ResponseEntity<Long> getCommentCount(@PathVariable Long blogId) {
        return ResponseEntity.ok(engagementService.getCommentCount(blogId));
    }

    private String extractUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new IllegalStateException("Unauthenticated");
        }
        return authentication.getName();
    }

    private String extractUsernameNullable() {
        try {
            return extractUsername();
        } catch (Exception ignored) {
            return null;
        }
    }
}


