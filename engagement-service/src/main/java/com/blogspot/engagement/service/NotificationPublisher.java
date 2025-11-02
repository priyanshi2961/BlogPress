package com.blogspot.engagement.service;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationPublisher {

    private final NotificationClient notificationClient;

    @Async
    @Retry(name = "notifications", fallbackMethod = "logFailure")
    @CircuitBreaker(name = "notifications", fallbackMethod = "logFailure")
    public void publishMilestone(Long blogId, String authorId, String authorName, String authorEmail,
                                 String blogTitle, String milestoneType, int count) {
        try {
            String key = UUID.randomUUID().toString();
            notificationClient.notifyMilestone(
                    key,
                    new NotificationClient.MilestonePayload(
                            blogId.toString(),
                            authorId,
                            authorName,
                            authorEmail,
                            blogTitle,
                            milestoneType,
                            count
                    )
            );
        } catch (Exception e) {
            log.warn("Failed to send milestone notification: {}", e.getMessage());
        }
    }

    @SuppressWarnings("unused")
    private void logFailure(Long blogId, String authorId, String authorName, String authorEmail,
                            String blogTitle, String milestoneType, int count, Throwable t) {
        log.warn("Notification service unavailable. Skipping milestone notification for blog {}: {}", blogId, t.getMessage());
    }
}


