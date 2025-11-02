package com.blogspot.engagement.service;

import com.blogspot.engagement.dto.CommentDtos.CommentResponse;
import com.blogspot.engagement.dto.CommentDtos.CreateCommentRequest;
import com.blogspot.engagement.dto.CommentDtos.UpdateCommentRequest;

import java.util.List;

public interface EngagementService {
    // Likes
    boolean likeBlog(Long blogId, String username);
    boolean unlikeBlog(Long blogId, String username);
    boolean toggleLike(Long blogId, String username);
    boolean isLiked(Long blogId, String username);
    long getLikeCount(Long blogId);

    // Views
    void recordView(Long blogId, String username, String ipAddress);
    long getViewCount(Long blogId);

    // Comments
    CommentResponse addComment(String username, CreateCommentRequest request);
    CommentResponse updateComment(Long commentId, String username, UpdateCommentRequest request);
    void deleteComment(Long commentId, String username);
    List<CommentResponse> getCommentsTree(Long blogId);
    long getCommentCount(Long blogId);
}


