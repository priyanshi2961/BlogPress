package com.blogspot.user.service;

import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "notification-service", url = "${NOTIFICATION_SERVICE_URL:}")
public interface NotificationClient {

    @PostMapping("/notifications/user-registered")
    void notifyUserRegistered(
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @RequestBody UserRegisteredPayload payload
    );

    @Data
    @AllArgsConstructor
    class UserRegisteredPayload {
        String userId;
        String username;
        String email;
    }
}


