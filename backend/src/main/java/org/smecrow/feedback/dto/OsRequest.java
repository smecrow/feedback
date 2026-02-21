package org.smecrow.feedback.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.smecrow.feedback.model.Os;
import org.smecrow.feedback.model.Reason;

import java.time.LocalDateTime;

public record OsRequest(
        @NotBlank String client,
        @NotNull Reason reason) {

    public Os toEntity() {
        Os os = new Os();

        os.setClient(client);
        os.setReason(reason);

        os.setCreatedAt(LocalDateTime.now());
        os.setStatus(org.smecrow.feedback.model.OsStatus.PENDENTE);

        return os;
    }
}


