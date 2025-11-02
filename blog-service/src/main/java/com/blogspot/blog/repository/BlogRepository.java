package com.blogspot.blog.repository;

import com.blogspot.blog.model.Blog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BlogRepository extends JpaRepository<Blog, Long> {

    Page<Blog> findByIsPublishedTrue(Pageable pageable);
    
    Page<Blog> findByAuthorId(Long authorId, Pageable pageable);
    
    Page<Blog> findByAuthorIdAndIsPublishedTrue(Long authorId, Pageable pageable);
    
    @Query("SELECT b FROM Blog b WHERE b.title LIKE %:keyword% OR b.content LIKE %:keyword%")
    Page<Blog> findByTitleContainingOrContentContaining(@Param("keyword") String keyword, @Param("keyword") String keyword2, Pageable pageable);
    
    @Query("SELECT b FROM Blog b WHERE (b.title LIKE %:keyword% OR b.content LIKE %:keyword%) AND b.isPublished = true")
    Page<Blog> findByTitleContainingOrContentContainingAndIsPublishedTrue(@Param("keyword") String keyword, @Param("keyword") String keyword2, Pageable pageable);
    
    Optional<Blog> findByIdAndIsPublishedTrue(Long id);
    
    boolean existsByIdAndAuthorId(Long id, Long authorId);
}
