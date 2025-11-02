package com.blogspot.engagement.service;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "notification-service")
public interface NotificationClient {

    @PostMapping("/notifications/milestone")
    void notifyMilestone(@RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
                         @RequestBody MilestonePayload payload);

    record MilestonePayload(String blogId, String authorId, String authorName, String authorEmail, String blogTitle,
                            String milestoneType, int count) {}
}


