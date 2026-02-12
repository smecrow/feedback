package org.smecrow.feedback.dto;

import org.smecrow.feedback.model.Os;
import org.smecrow.feedback.model.Reason;

import java.time.LocalDateTime;


public record OsResponse(Long id,
                         String client,
                         Reason reason,
                         LocalDateTime createdAt,
                         Boolean done,
                         String username) {

    public OsResponse{
    }

    public static OsResponse fromEntity(Os os) {
        return new OsResponse(
                os.getId(),
                os.getClient(),
                os.getReason(),
                os.getCreatedAt(),
                os.getDone(),
                os.getUser().getUsername());
    }
}


