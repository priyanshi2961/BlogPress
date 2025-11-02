package com.blogspot.blog.security;

import com.blogspot.blog.dto.UserDto;
import com.blogspot.blog.service.UserServiceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomUserDetailsService implements UserDetailsService {

    private final UserServiceClient userServiceClient;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        try {
            // For JWT validation, we don't need to make a service call
            // The actual user validation happens in the service layer
            // This is just to satisfy Spring Security's UserDetailsService requirement
            return User.builder()
                    .username(username)
                    .password("") // Password is not used for JWT authentication
                    .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")))
                    .accountExpired(false)
                    .accountLocked(false)
                    .credentialsExpired(false)
                    .disabled(false)
                    .build();
        } catch (Exception e) {
            log.error("Error loading user details for username: {}", username, e);
            throw new UsernameNotFoundException("User not found: " + username);
        }
    }
}
