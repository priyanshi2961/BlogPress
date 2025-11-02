package com.blogspot.user.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationPublisher {

    private final NotificationClient notificationClient;

    @Async
    @Retry(name = "notifications", fallbackMethod = "logFailure")
    @CircuitBreaker(name = "notifications", fallbackMethod = "logFailure")
    public void publishUserRegistered(Long userId, String username, String email) {
        String key = UUID.randomUUID().toString();
        notificationClient.notifyUserRegistered(
                key,
                new NotificationClient.UserRegisteredPayload(
                        userId != null ? userId.toString() : null,
                        username,
                        email
                )
        );
    }

    private void logFailure(Long userId, String username, String email, Throwable t) {
        log.error("Fallback for publishUserRegistered: Failed to send welcome email for user {}. Error: {}", username, t.getMessage());
    }
}


