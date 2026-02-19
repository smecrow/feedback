package org.smecrow.feedback.dto;

public record AuthResponse(String token,
                           String username,
                           String email) {
}
