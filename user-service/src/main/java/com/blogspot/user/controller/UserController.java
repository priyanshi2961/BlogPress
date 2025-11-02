package com.blogspot.user.controller;

import com.blogspot.user.dto.JwtResponseDto;
import com.blogspot.user.dto.UserLoginDto;
import com.blogspot.user.dto.UserProfileDto;
import com.blogspot.user.dto.UserRegistrationDto;
import com.blogspot.user.model.User;
import com.blogspot.user.service.JwtService;
import com.blogspot.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final JwtService jwtService;

    public UserController(UserService userService, JwtService jwtService) {
        this.userService = userService;
        this.jwtService = jwtService;
    }

    // --- PUBLIC ENDPOINTS ---

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody UserRegistrationDto registrationDto) {
        // This remains public for anyone to register
        try {
            userService.registerNewUser(registrationDto);
            return ResponseEntity.ok("User registered successfully!");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/register/admin")
    public ResponseEntity<?> registerAdmin(@Valid @RequestBody UserRegistrationDto registrationDto) {
        // This endpoint is for creating admin users (in production, this should be secured)
        try {
            userService.registerNewAdmin(registrationDto);
            return ResponseEntity.ok("Admin registered successfully!");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@Valid @RequestBody UserLoginDto loginDto) {
        // This remains public for anyone to log in
        try {
            User user = userService.authenticateUser(loginDto);
            // In a real app, you might want to include roles in the token
            String jwt = jwtService.generateToken(user.getUsername());
            return ResponseEntity.ok(new JwtResponseDto(jwt, "Bearer", user.getId(), user.getUsername(), user.getEmail()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Invalid credentials");
        }
    }

    // --- USER PROFILE ENDPOINTS ---

    @GetMapping("/profile")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<UserProfileDto> getCurrentUserProfile() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            UserProfileDto userProfile = userService.getUserProfileByUsername(username);
            return ResponseEntity.ok(userProfile);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/profile")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<UserProfileDto> updateCurrentUserProfile(@Valid @RequestBody UserProfileDto userProfileDto) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            UserProfileDto updatedUser = userService.updateUserByUsername(username, userProfileDto);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // --- ADMIN-ONLY CRUD OPERATIONS ---

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserProfileDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    // Internal endpoint: list all user emails for broadcast (secured at gateway/network level)
    @GetMapping("/internal/emails")
    public ResponseEntity<List<String>> getAllUserEmailsInternal() {
        return ResponseEntity.ok(userService.getAllUserEmails());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserProfileDto> getUserById(@PathVariable Long id) {
        try {
            UserProfileDto userProfile = userService.getUserProfile(id);
            return ResponseEntity.ok(userProfile);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Internal endpoint: fetch user profile by id (author lookup for notifications)
    @GetMapping("/internal/{id}")
    public ResponseEntity<UserProfileDto> getUserByIdInternal(@PathVariable Long id) {
        try {
            UserProfileDto userProfile = userService.getUserProfile(id);
            return ResponseEntity.ok(userProfile);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserProfileDto> updateUser(@PathVariable Long id, @Valid @RequestBody UserProfileDto userProfileDto) {
        try {
            UserProfileDto updatedUser = userService.updateUser(id, userProfileDto);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok("User deleted successfully!");
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}