package com.blogspot.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JwtResponseDto {
    private String token;
    private String type = "Bearer";
    private Long id;
    private String username;
    private String email;
}