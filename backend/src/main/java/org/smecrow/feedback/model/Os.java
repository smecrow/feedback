package org.smecrow.feedback.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "Os", indexes = {
        @Index(name = "idx_os_client", columnList = "client"),
        @Index(name = "idx_os_done", columnList = "done"),
        @Index(name = "idx_os_created_at", columnList = "createdAt"),
        @Index(name = "idx_os_reason", columnList = "reason"),
        @Index(name = "idx_os_user_id", columnList = "user_id")
})
@Getter
@Setter
@EqualsAndHashCode(of = "id")
@NoArgsConstructor
@AllArgsConstructor
public class Os {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String client;
    @Enumerated(EnumType.STRING)
    private Reason reason;
    private LocalDateTime createdAt;
    private Boolean done;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
