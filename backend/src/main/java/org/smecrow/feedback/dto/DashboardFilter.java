package org.smecrow.feedback.dto;

public record DashboardFilter(Integer month,
                              Integer year,
                              String client,
                              String reason,
                              Boolean done,
                              @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME)
                              java.time.LocalDateTime startDate,
                              @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME)
                              java.time.LocalDateTime endDate) {
}
