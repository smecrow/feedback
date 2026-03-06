package org.smecrow.feedback.dto;

public record AuthResponse(String token,
                           String refreshToken,
                           String username,
                           String email) {
}
