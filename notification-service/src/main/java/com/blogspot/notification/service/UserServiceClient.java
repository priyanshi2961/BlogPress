package com.blogspot.notification.service;

import lombok.Data;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "user-service")
public interface UserServiceClient {

    @GetMapping("/api/users/internal/{id}")
    UserProfileDto getUserById(@PathVariable("id") String id);

    @GetMapping("/api/users/internal/emails")
    List<String> getAllUserEmails();

    @Data
    class UserProfileDto {
        private Long id;
        private String username;
        private String email;
        private String firstName;
        private String lastName;
        private String role;
    }
}


