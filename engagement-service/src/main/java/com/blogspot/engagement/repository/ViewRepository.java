package com.blogspot.engagement.repository;

import com.blogspot.engagement.model.ViewEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ViewRepository extends JpaRepository<ViewEntity, Long> {
    long countByBlogId(Long blogId);
}


