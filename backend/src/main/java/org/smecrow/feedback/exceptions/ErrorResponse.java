package org.smecrow.feedback.exceptions;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class ErrorResponse {
    private String message;
    private int status;
    private String error;
    private String path;
    private String details;
    private Instant timestamp;

    public ErrorResponse(String message, int status) {
        this(message, status, null, null, null);
    }

    public ErrorResponse(String message, int status, String error, String path, String details) {
        this.message = message;
        this.status = status;
        this.error = error;
        this.path = path;
        this.details = details;
        this.timestamp = Instant.now();
    }
}
