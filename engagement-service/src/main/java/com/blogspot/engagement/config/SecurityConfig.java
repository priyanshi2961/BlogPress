package com.blogspot.engagement.config;

import com.blogspot.engagement.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints (no authentication required)
                        .requestMatchers("/api/engagement/public/**").permitAll()
                        // Allow actuator endpoints for health checks
                        .requestMatchers("/actuator/**").permitAll()
                        // Protected endpoints (authentication required)
                        .requestMatchers("/api/engagement/blogs/*/likes").authenticated()
                        .requestMatchers("/api/engagement/blogs/*/likes/**").authenticated()
                        .requestMatchers("/api/engagement/blogs/*/comments").authenticated()
                        .requestMatchers("/api/engagement/blogs/*/comments/**").authenticated()
                        // All other requests require authentication
                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }
}


