package org.smecrow.feedback.dto;
import java.time.LocalDateTime;
import org.springframework.format.annotation.DateTimeFormat;

public record DashboardFilter(Integer month,
                              Integer year,
                              String client,
                              String reason,
                              Boolean done,
                              @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                              LocalDateTime startDate,
                              @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                              java.time.LocalDateTime endDate) {
}
