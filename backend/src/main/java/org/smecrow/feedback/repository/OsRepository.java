package org.smecrow.feedback.repository;

import org.smecrow.feedback.model.Os;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

public interface OsRepository extends JpaRepository<Os, Long> {
    Page<Os> findByUser(org.smecrow.feedback.model.User user, Pageable pageable);
    
    Page<Os> findByUserAndClientContainingIgnoreCase(org.smecrow.feedback.model.User user, String client, Pageable pageable);

    Page<Os> findByUserAndStatus(org.smecrow.feedback.model.User user, org.smecrow.feedback.model.OsStatus status, Pageable pageable);

    Page<Os> findByUserAndCreatedAtBetween(org.smecrow.feedback.model.User user, LocalDateTime dateAfter, LocalDateTime dateBefore, Pageable pageable);

    Page<Os> findByUserAndReason(org.smecrow.feedback.model.User user, org.smecrow.feedback.model.Reason reason, Pageable pageable);

    void deleteByUser(org.smecrow.feedback.model.User user);
}
