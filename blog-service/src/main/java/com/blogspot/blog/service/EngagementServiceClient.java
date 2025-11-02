package com.blogspot.blog.service;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "engagement-service")
public interface EngagementServiceClient {

    @GetMapping("/api/engagement/public/blogs/{blogId}/likes/count")
    Long getLikeCount(@PathVariable("blogId") Long blogId);

    @GetMapping("/api/engagement/public/blogs/{blogId}/views/count")
    Long getViewCount(@PathVariable("blogId") Long blogId);

    @GetMapping("/api/engagement/public/blogs/{blogId}/comments/count")
    Long getCommentCount(@PathVariable("blogId") Long blogId);
}
