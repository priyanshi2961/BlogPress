package com.blogspot.engagement.service;

import com.blogspot.engagement.dto.CommentDtos.CommentResponse;
import com.blogspot.engagement.dto.CommentDtos.CreateCommentRequest;
import com.blogspot.engagement.dto.CommentDtos.UpdateCommentRequest;
import com.blogspot.engagement.model.CommentEntity;
import com.blogspot.engagement.model.LikeEntity;
import com.blogspot.engagement.model.ViewEntity;
import com.blogspot.engagement.repository.CommentRepository;
import com.blogspot.engagement.repository.LikeRepository;
import com.blogspot.engagement.repository.ViewRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import lombok.Data;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Service
@RequiredArgsConstructor
@Slf4j
public class EngagementServiceImpl implements EngagementService {

    private final LikeRepository likeRepository;
    private final ViewRepository viewRepository;
    private final CommentRepository commentRepository;
    private final NotificationPublisher notificationPublisher;
    private final BlogServiceClient blogServiceClient;

    // Likes
    @Override
    @Transactional
    public boolean likeBlog(Long blogId, String username) {
        if (likeRepository.existsByBlogIdAndUsername(blogId, username)) {
            return false; // already liked
        }
        LikeEntity like = LikeEntity.builder()
            .blogId(blogId)
            .username(username)
            .build();
        likeRepository.save(like);
        
        // Check for milestone after saving the like
        checkAndPublishMilestone(blogId, "LIKES");
        
        return true;
    }

    @Override
    @Transactional
    public boolean unlikeBlog(Long blogId, String username) {
        Optional<LikeEntity> existing = likeRepository.findByBlogIdAndUsername(blogId, username);
        if (existing.isEmpty()) {
            return false;
        }
        likeRepository.delete(existing.get());
        return true;
    }

    @Override
    @Transactional
    public boolean toggleLike(Long blogId, String username) {
        if (likeRepository.existsByBlogIdAndUsername(blogId, username)) {
            // User has already liked, so unlike
            Optional<LikeEntity> existing = likeRepository.findByBlogIdAndUsername(blogId, username);
            if (existing.isPresent()) {
                likeRepository.delete(existing.get());
                return false; // unliked
            }
        } else {
            // User hasn't liked, so like
            LikeEntity like = LikeEntity.builder()
                .blogId(blogId)
                .username(username)
                .build();
            likeRepository.save(like);
            
            // Check for milestone after saving the like
            checkAndPublishMilestone(blogId, "LIKES");
            
            return true; // liked
        }
        return false;
    }

    @Override
    public boolean isLiked(Long blogId, String username) {
        return likeRepository.existsByBlogIdAndUsername(blogId, username);
    }

    @Override
    public long getLikeCount(Long blogId) {
        return likeRepository.countByBlogId(blogId);
    }

    // Views
    @Override
    @Transactional
    public void recordView(Long blogId, String username, String ipAddress) {
        ViewEntity view = ViewEntity.builder()
            .blogId(blogId)
            .username(username)
            .ipAddress(ipAddress)
            .build();
        viewRepository.save(view);
        // Check for milestone after recording the view
        checkAndPublishMilestone(blogId, "VIEWS");
    }

    @Override
    public long getViewCount(Long blogId) {
        return viewRepository.countByBlogId(blogId);
    }

    // Comments
    @Override
    @Transactional
    public CommentResponse addComment(String username, CreateCommentRequest request) {
        CommentEntity parent = null;
        if (request.getParentId() != null) {
            parent = commentRepository.findById(request.getParentId())
                .orElseThrow(() -> new EntityNotFoundException("Parent comment not found"));
        }
        CommentEntity entity = CommentEntity.builder()
            .blogId(request.getBlogId())
            .username(username)
            .content(request.getContent())
            .parent(parent)
            .build();
        CommentEntity saved = commentRepository.save(entity);
        // Check for milestone after saving the comment
        checkAndPublishMilestone(request.getBlogId(), "COMMENTS");
        return toResponse(saved, true);
    }

    @Override
    @Transactional
    public CommentResponse updateComment(Long commentId, String username, UpdateCommentRequest request) {
        CommentEntity entity = commentRepository.findById(commentId)
            .orElseThrow(() -> new EntityNotFoundException("Comment not found"));
        if (!entity.getUsername().equals(username)) {
            throw new SecurityException("You can only update your own comments");
        }
        entity.setContent(request.getContent());
        CommentEntity saved = commentRepository.save(entity);
        return toResponse(saved, true);
    }

    @Override
    @Transactional
    public void deleteComment(Long commentId, String username) {
        CommentEntity entity = commentRepository.findById(commentId)
            .orElseThrow(() -> new EntityNotFoundException("Comment not found"));
        if (!entity.getUsername().equals(username)) {
            throw new SecurityException("You can only delete your own comments");
        }
        commentRepository.delete(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommentResponse> getCommentsTree(Long blogId) {
        List<CommentEntity> roots = commentRepository.findByBlogIdAndParentIsNullOrderByCreatedAtAsc(blogId);
        return roots.stream()
            .map(root -> toResponse(root, true))
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public long getCommentCount(Long blogId) {
        return commentRepository.countByBlogId(blogId);
    }

    private CommentResponse toResponse(CommentEntity entity, boolean includeReplies) {
        CommentResponse response = CommentResponse.builder()
            .id(entity.getId())
            .blogId(entity.getBlogId())
            .username(entity.getUsername())
            .content(entity.getContent())
            .parentId(entity.getParent() != null ? entity.getParent().getId() : null)
            .createdAt(entity.getCreatedAt())
            .updatedAt(entity.getUpdatedAt())
            .build();
        if (includeReplies) {
            List<CommentEntity> children = commentRepository.findByParentIdOrderByCreatedAtAsc(entity.getId());
            List<CommentResponse> childResponses = new ArrayList<>();
            for (CommentEntity child : children) {
                childResponses.add(toResponse(child, true));
            }
            response.setReplies(childResponses);
        }
        return response;
    }

    /**
     * Checks if the current count is a milestone and publishes an event if it is.
     * Milestones are: 10, 50, 100, 500, 1000, etc.
     */
    private void checkAndPublishMilestone(Long blogId, String milestoneType) {
        try {
            long count = 0;
            if ("LIKES".equals(milestoneType)) {
                count = getLikeCount(blogId);
            } else if ("COMMENTS".equals(milestoneType)) {
                count = getCommentCount(blogId);
            } else if ("VIEWS".equals(milestoneType)) {
                count = getViewCount(blogId);
            }

            log.debug("Milestone check for blog {} type {} count {}", blogId, milestoneType, count);

            // Check if it's a milestone (5, 10, 50, 100, 500, 1000, etc.)
            if (isMilestone(count)) {
                String authorId = null;
                String blogTitle = null;
                try {
                    // Best effort: fetch author id, but do not block publishing if unavailable
                    BlogDetails blog = blogServiceClient.getBlogPublic(blogId);
                    if (blog != null) {
                        if (blog.authorId != null) {
                            authorId = blog.authorId.toString();
                        }
                        blogTitle = blog.title;
                    }
                } catch (Exception ex) {
                    log.warn("Could not fetch blog details for {} during milestone publish: {}", blogId, ex.getMessage());
                }

                try {
                    notificationPublisher.publishMilestone(
                            blogId,
                            authorId,
                            null,
                            null,
                            blogTitle,
                            milestoneType,
                            (int) count
                    );
                } catch (Exception ex) {
                    log.warn("Non-blocking failure scheduling REST milestone notification for blog {}: {}", blogId, ex.getMessage());
                }
            } else {
                log.debug("Not a milestone for blog {} type {} at count {}", blogId, milestoneType, count);
            }
        } catch (Exception e) {
            log.error("Failed to check/publish milestone for blog: {}. Error: {}", 
                    blogId, e.getMessage(), e);
            // Don't fail the like operation if milestone checking fails
        }
    }

    @FeignClient(name = "blog-service")
    interface BlogServiceClient {
        @GetMapping("/api/blogs/internal/{id}")
        BlogDetails getBlogPublic(@PathVariable("id") Long id);
    }

    @Data
    static class BlogDetails {
        private Long id;
        private String title;
        private Long authorId;
    }

    /**
     * Checks if a count represents a milestone.
     * Milestones are: 10, 50, 100, 500, 1000, 5000, 10000, etc.
     */
    private boolean isMilestone(long count) {
        return count == 5 || count == 10 || count == 50 || count == 100 || count == 500 || 
               count == 1000 || count == 5000 || count == 10000 || 
               (count > 10000 && count % 10000 == 0);
    }
}


