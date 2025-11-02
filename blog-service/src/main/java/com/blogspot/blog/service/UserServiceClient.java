package com.blogspot.blog.service;

import com.blogspot.blog.dto.UserDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "user-service", url = "${USER_SERVICE_URL:}")
public interface UserServiceClient {

    @GetMapping("/api/users/profile")
    ResponseEntity<UserDto> getUserProfile(@RequestHeader("Authorization") String token);

    @GetMapping("/api/users/{id}")
    ResponseEntity<UserDto> getUserById(@PathVariable Long id, @RequestHeader("Authorization") String token);
}
