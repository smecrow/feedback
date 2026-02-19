package org.smecrow.feedback.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.smecrow.feedback.model.Os;
import org.smecrow.feedback.model.Reason;

import java.time.LocalDateTime;

public record OsImportRequest(
        @NotBlank String client,
        @NotNull Reason reason,
        boolean done,
        LocalDateTime createdAt
) {
    public Os toEntity() {
        Os os = new Os();
        os.setClient(client);
        os.setReason(reason);
        os.setDone(done);
        os.setCreatedAt(createdAt != null ? createdAt : LocalDateTime.now());
        return os;
    }
}
