package com.blogspot.blog.service;

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
    public void publishBlogCreated(Long blogId, Long authorId, String blogTitle, String authorName) {
        try {
            String key = UUID.randomUUID().toString();
            notificationClient.notifyBlogCreated(
                    key,
                    new NotificationClient.BlogCreatedPayload(
                            blogId.toString(),
                            authorId != null ? authorId.toString() : null,
                            blogTitle,
                            authorName
                    )
            );
        } catch (Exception e) {
            log.warn("Failed to send blog-created notification: {}", e.getMessage());
        }
    }

    @SuppressWarnings("unused")
    private void logFailure(Long blogId, Long authorId, String blogTitle, String authorName, Throwable t) {
        log.warn("Notification service unavailable. Skipping blog-created notification for blog {}: {}", blogId, t.getMessage());
    }
}


