package com.blogspot.engagement.repository;

import com.blogspot.engagement.model.CommentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommentRepository extends JpaRepository<CommentEntity, Long> {
    long countByBlogId(Long blogId);
    List<CommentEntity> findByBlogIdAndParentIsNullOrderByCreatedAtAsc(Long blogId);
    
    @Query("SELECT c FROM CommentEntity c WHERE c.parent.id = :parentId ORDER BY c.createdAt ASC")
    List<CommentEntity> findByParentIdOrderByCreatedAtAsc(@Param("parentId") Long parentId);
}


