package org.smecrow.feedback.dto;

import org.smecrow.feedback.model.Os;
import org.smecrow.feedback.model.Reason;
import org.smecrow.feedback.model.OsStatus;

import java.time.LocalDateTime;


public record OsResponse(Long id,
                         String client,
                         Reason reason,
                         LocalDateTime createdAt,
                         OsStatus status,
                         String username) {

    public OsResponse{
    }

    public static OsResponse fromEntity(Os os) {
        return new OsResponse(
                os.getId(),
                os.getClient(),
                os.getReason(),
                os.getCreatedAt(),
                os.getStatus(),
                os.getUser().getUsername());
    }
}


