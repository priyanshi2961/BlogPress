package com.blogspot.notification.controller;

import com.blogspot.notification.service.EmailService;
import com.blogspot.notification.service.UserServiceClient;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final EmailService emailService;
    private final UserServiceClient userServiceClient;

    private final Map<String, Instant> idempotencyKeys = new ConcurrentHashMap<>();

    @PostMapping("/blog-created")
    public ResponseEntity<Void> blogCreated(
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @RequestBody BlogCreatedRequest request) {

        if (isDuplicate(idempotencyKey)) {
            return ResponseEntity.accepted().build();
        }
        rememberKey(idempotencyKey);

        CompletableFuture.runAsync(() -> {
            try {
                String subject = emailService.buildNewBlogSubject(request.blogTitle);
                String body = emailService.buildNewBlogBody(request.blogTitle, request.authorName);
                if (request.broadcastEmails != null) {
                    emailService.sendBulkSimpleMail(request.broadcastEmails, subject, body);
                } else {
                    try {
                        var allEmails = userServiceClient.getAllUserEmails();
                        if (allEmails != null && allEmails.iterator().hasNext()) {
                            String authorEmail = null;
                            try {
                                if (StringUtils.hasText(request.authorId)) {
                                    var author = userServiceClient.getUserById(request.authorId);
                                    authorEmail = author != null ? author.getEmail() : null;
                                }
                            } catch (Exception ex) {
                                log.warn("Unable to resolve author email for authorId {}: {}", request.authorId, ex.getMessage());
                            }

                            // Exclude author's own email from broadcast if present
                            var filtered = new java.util.ArrayList<String>();
                            for (String email : allEmails) {
                                if (email == null) continue;
                                if (authorEmail != null && email.equalsIgnoreCase(authorEmail)) continue;
                                filtered.add(email);
                            }

                            if (!filtered.isEmpty()) {
                                emailService.sendBulkSimpleMail(filtered, subject, body);
                            } else if (StringUtils.hasText(request.recipientEmail)) {
                                emailService.sendSimpleMail(request.recipientEmail, subject, body);
                            }
                        } else if (StringUtils.hasText(request.recipientEmail)) {
                            emailService.sendSimpleMail(request.recipientEmail, subject, body);
                        }
                    } catch (Exception fetchEx) {
                        log.warn("Unable to fetch all user emails for broadcast: {}", fetchEx.getMessage());
                        if (StringUtils.hasText(request.recipientEmail)) {
                            emailService.sendSimpleMail(request.recipientEmail, subject, body);
                        }
                    }
                }
            } catch (Exception e) {
                log.error("Failed to process blog-created notification: {}", e.getMessage(), e);
            }
        });

        return ResponseEntity.accepted().build();
    }

    @PostMapping("/milestone")
    public ResponseEntity<Void> milestone(
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @RequestBody MilestoneRequest request) {

        if (isDuplicate(idempotencyKey)) {
            return ResponseEntity.accepted().build();
        }
        rememberKey(idempotencyKey);

        CompletableFuture.runAsync(() -> {
            try {
                String authorEmail = request.authorEmail;
                if (!StringUtils.hasText(authorEmail) && StringUtils.hasText(request.authorId)) {
                    try {
                        var user = userServiceClient.getUserById(request.authorId);
                        authorEmail = user != null ? user.getEmail() : null;
                    } catch (Exception fetchEx) {
                        log.warn("Unable to fetch author email for id {}: {}", request.authorId, fetchEx.getMessage());
                    }
                }

                emailService.sendMilestoneNotification(
                        authorEmail,
                        request.blogTitle,
                        request.milestoneType,
                        request.count,
                        request.authorName
                );
            } catch (Exception e) {
                log.error("Failed to process milestone notification: {}", e.getMessage(), e);
            }
        });

        return ResponseEntity.accepted().build();
    }

    @PostMapping("/user-registered")
    public ResponseEntity<Void> userRegistered(
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @RequestBody UserRegisteredRequest request) {

        if (isDuplicate(idempotencyKey)) {
            return ResponseEntity.accepted().build();
        }
        rememberKey(idempotencyKey);

        CompletableFuture.runAsync(() -> {
            try {
                String subject = emailService.buildWelcomeSubject(request.username);
                String body = emailService.buildWelcomeBody(request.username);
                if (StringUtils.hasText(request.email)) {
                    emailService.sendSimpleMail(request.email, subject, body);
                }
            } catch (Exception e) {
                log.error("Failed to process user-registered notification: {}", e.getMessage(), e);
            }
        });

        return ResponseEntity.accepted().build();
    }

    private boolean isDuplicate(String key) {
        if (!StringUtils.hasText(key)) {
            return false;
        }
        return idempotencyKeys.containsKey(key);
    }

    private void rememberKey(String key) {
        if (!StringUtils.hasText(key)) {
            return;
        }
        idempotencyKeys.putIfAbsent(key, Instant.now());
    }

    public record BlogCreatedRequest(
            @NotBlank String blogId,
            @NotBlank String authorId,
            @NotBlank String blogTitle,
            String authorName,
            String recipientEmail,
            Iterable<String> broadcastEmails
    ) {}

    public record MilestoneRequest(
            @NotBlank String blogId,
            String authorId,
            String authorName,
            String authorEmail,
            @NotBlank String blogTitle,
            @NotBlank String milestoneType,
            int count
    ) {}

    public record UserRegisteredRequest(
            @NotBlank String userId,
            String username,
            @NotBlank String email
    ) {}
}


