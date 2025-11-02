package com.blogspot.user.service;

import com.blogspot.user.dto.UserLoginDto;
import com.blogspot.user.dto.UserRegistrationDto;
import com.blogspot.user.dto.UserProfileDto;
import com.blogspot.user.exception.UserNotFoundException;
import com.blogspot.user.model.Role;
import com.blogspot.user.model.User;
import com.blogspot.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationPublisher notificationPublisher;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, NotificationPublisher notificationPublisher) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.notificationPublisher = notificationPublisher;
    }

    public User registerNewUser(UserRegistrationDto registrationDto) {
        if (userRepository.existsByUsername(registrationDto.getUsername())) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (userRepository.existsByEmail(registrationDto.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        User user = User.builder()
                .username(registrationDto.getUsername())
                .email(registrationDto.getEmail())
                .password(passwordEncoder.encode(registrationDto.getPassword()))
                .firstName(registrationDto.getFirstName())
                .lastName(registrationDto.getLastName())
                .role(Role.USER) // New users are assigned the USER role by default
                .build();

        User saved = userRepository.save(user);
        try {
            notificationPublisher.publishUserRegistered(saved.getId(), saved.getUsername(), saved.getEmail());
        } catch (Exception ex) {
            // fire-and-forget; do not block registration on email failures
        }
        return saved;
    }

    public User registerNewAdmin(UserRegistrationDto registrationDto) {
        if (userRepository.existsByUsername(registrationDto.getUsername())) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (userRepository.existsByEmail(registrationDto.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        User user = User.builder()
                .username(registrationDto.getUsername())
                .email(registrationDto.getEmail())
                .password(passwordEncoder.encode(registrationDto.getPassword()))
                .firstName(registrationDto.getFirstName())
                .lastName(registrationDto.getLastName())
                .role(Role.ADMIN) // Admin users are assigned the ADMIN role
                .build();

        return userRepository.save(user);
    }

    public User authenticateUser(UserLoginDto loginDto) {
        User user = userRepository.findByUsername(loginDto.getUsername())
                .orElseThrow(() -> new UserNotFoundException("User not found with username: " + loginDto.getUsername()));

        if (!passwordEncoder.matches(loginDto.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid username or password");
        }

        return user;
    }

    public UserProfileDto getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));

        return new UserProfileDto(user.getId(), user.getUsername(), user.getEmail(), user.getFirstName(), user.getLastName(), user.getRole().name());
    }

    public UserProfileDto getUserProfileByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("User not found with username: " + username));

        return new UserProfileDto(user.getId(), user.getUsername(), user.getEmail(), user.getFirstName(), user.getLastName(), user.getRole().name());
    }

    public UserProfileDto updateUserByUsername(String username, UserProfileDto userProfileDto) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("User not found with username: " + username));

        // Check if the new username is already taken by another user
        if (!username.equals(userProfileDto.getUsername()) && 
            userRepository.existsByUsername(userProfileDto.getUsername())) {
            throw new IllegalArgumentException("Username already exists");
        }

        // Check if the new email is already taken by another user
        if (!user.getEmail().equals(userProfileDto.getEmail()) && 
            userRepository.existsByEmail(userProfileDto.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        user.setUsername(userProfileDto.getUsername());
        user.setEmail(userProfileDto.getEmail());
        user.setFirstName(userProfileDto.getFirstName());
        user.setLastName(userProfileDto.getLastName());

        User updatedUser = userRepository.save(user);
        return new UserProfileDto(updatedUser.getId(), updatedUser.getUsername(), updatedUser.getEmail(), updatedUser.getFirstName(), updatedUser.getLastName(), updatedUser.getRole().name());
    }

    // --- ADMIN-ONLY CRUD METHODS ---

    public List<UserProfileDto> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(user -> new UserProfileDto(user.getId(), user.getUsername(), user.getEmail(), user.getFirstName(), user.getLastName(), user.getRole().name()))
                .collect(Collectors.toList());
    }

    public List<String> getAllUserEmails() {
        return userRepository.findAll()
                .stream()
                .map(User::getEmail)
                .collect(Collectors.toList());
    }

    public UserProfileDto updateUser(Long userId, UserProfileDto userProfileDto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));

        user.setUsername(userProfileDto.getUsername());
        user.setEmail(userProfileDto.getEmail());
        user.setFirstName(userProfileDto.getFirstName());
        user.setLastName(userProfileDto.getLastName());
        // Note: Password updates should have their own dedicated and secure process.

        User updatedUser = userRepository.save(user);
        return new UserProfileDto(updatedUser.getId(), updatedUser.getUsername(), updatedUser.getEmail(), updatedUser.getFirstName(), updatedUser.getLastName(), updatedUser.getRole().name());
    }

    public void deleteUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new UserNotFoundException("User not found with id: " + userId);
        }
        userRepository.deleteById(userId);
    }
}