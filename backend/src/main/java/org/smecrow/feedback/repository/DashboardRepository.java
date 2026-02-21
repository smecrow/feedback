package org.smecrow.feedback.repository;

import org.smecrow.feedback.model.Os;
import org.smecrow.feedback.model.Reason;
import org.smecrow.feedback.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;

public interface DashboardRepository extends JpaRepository<Os, Long> {
    @Query("SELECT COUNT(o) FROM Os o WHERE o.user = :user " +
           "AND o.createdAt >= COALESCE(:startDate, o.createdAt) " +
           "AND o.createdAt <= COALESCE(:endDate, o.createdAt) " +
           "AND o.status = COALESCE(:status, o.status) " +
           "AND o.reason = COALESCE(:reason, o.reason)")
    long countByFilter(User user, LocalDateTime startDate, LocalDateTime endDate, org.smecrow.feedback.model.OsStatus status, Reason reason);

    @Query("SELECT o.reason, COUNT(o) FROM Os o WHERE o.user = :user " +
           "AND o.createdAt >= COALESCE(:startDate, o.createdAt) " +
           "AND o.createdAt <= COALESCE(:endDate, o.createdAt) " +
           "AND o.status = COALESCE(:status, o.status) " +
           "GROUP BY o.reason")
    List<Object[]> countByReasonWithFilter(User user, LocalDateTime startDate, LocalDateTime endDate, org.smecrow.feedback.model.OsStatus status);

    @Query("SELECT o.status, COUNT(o) FROM Os o WHERE o.user = :user " +
           "AND o.createdAt >= COALESCE(:startDate, o.createdAt) " +
           "AND o.createdAt <= COALESCE(:endDate, o.createdAt) " +
           "AND o.reason = COALESCE(:reason, o.reason) " +
           "GROUP BY o.status")
    List<Object[]> countByStatusWithFilter(User user, LocalDateTime startDate, LocalDateTime endDate, Reason reason);

    @Query("SELECT EXTRACT(MONTH FROM o.createdAt), COUNT(o) FROM Os o WHERE o.user = :user " +
           "AND o.createdAt >= COALESCE(:startDate, o.createdAt) " +
           "AND o.createdAt <= COALESCE(:endDate, o.createdAt) " +
           "AND o.status = COALESCE(:status, o.status) " +
           "AND o.reason = COALESCE(:reason, o.reason) " +
           "GROUP BY EXTRACT(MONTH FROM o.createdAt)")
    List<Object[]> countByMonthWithFilter(User user, LocalDateTime startDate, LocalDateTime endDate, org.smecrow.feedback.model.OsStatus status, Reason reason);

    @Query("SELECT o.client, COUNT(o) FROM Os o WHERE o.user = :user " +
           "AND o.createdAt >= COALESCE(:startDate, o.createdAt) " +
           "AND o.createdAt <= COALESCE(:endDate, o.createdAt) " +
           "AND o.status = COALESCE(:status, o.status) " +
           "AND o.reason = COALESCE(:reason, o.reason) " +
           "GROUP BY o.client ORDER BY COUNT(o) DESC")
    List<Object[]> findTopClientsWithFilter(User user, LocalDateTime startDate, LocalDateTime endDate, org.smecrow.feedback.model.OsStatus status, Reason reason, Pageable pageable);

    @Query("SELECT o FROM Os o WHERE o.user = :user " +
           "AND o.createdAt >= COALESCE(:startDate, o.createdAt) " +
           "AND o.createdAt <= COALESCE(:endDate, o.createdAt) " +
           "AND o.status = COALESCE(:status, o.status) " +
           "AND o.reason = COALESCE(:reason, o.reason) " +
           "ORDER BY o.createdAt DESC")
    List<Os> findLatestWithFilter(User user, LocalDateTime startDate, LocalDateTime endDate, org.smecrow.feedback.model.OsStatus status, Reason reason, Pageable pageable);

    long countByUserAndClient(User user, String client);
}
