package com.blogspot.blog.service;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "notification-service", url = "${NOTIFICATION_SERVICE_URL:}")
public interface NotificationClient {

    @PostMapping("/notifications/blog-created")
    void notifyBlogCreated(@RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
                           @RequestBody BlogCreatedPayload payload);

    @PostMapping("/notifications/milestone")
    void notifyMilestone(@RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
                         @RequestBody MilestonePayload payload);

    record BlogCreatedPayload(String blogId, String authorId, String blogTitle, String authorName) {}

    record MilestonePayload(String blogId, String authorId, String authorName, String authorEmail, String blogTitle,
                            String milestoneType, int count) {}
}


