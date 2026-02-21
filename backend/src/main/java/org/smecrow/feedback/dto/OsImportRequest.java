package org.smecrow.feedback.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.smecrow.feedback.model.Os;
import org.smecrow.feedback.model.Reason;
import org.smecrow.feedback.model.OsStatus;

import java.time.LocalDateTime;

public record OsImportRequest(
        @NotBlank String client,
        @NotNull Reason reason,
        OsStatus status,
        LocalDateTime createdAt
) {
    public Os toEntity() {
        Os os = new Os();
        os.setClient(client);
        os.setReason(reason);
        os.setStatus(status != null ? status : OsStatus.PENDENTE);
        os.setCreatedAt(createdAt != null ? createdAt : LocalDateTime.now());
        return os;
    }
}
