package com.blogspot.engagement.repository;

import com.blogspot.engagement.model.LikeEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LikeRepository extends JpaRepository<LikeEntity, Long> {
    long countByBlogId(Long blogId);
    Optional<LikeEntity> findByBlogIdAndUsername(Long blogId, String username);
    boolean existsByBlogIdAndUsername(Long blogId, String username);
}


