package org.smecrow.feedback.stats;

import org.smecrow.feedback.dto.DashboardFilter;
import org.smecrow.feedback.interfaces.StatProcessor;
import org.smecrow.feedback.model.Reason;
import org.smecrow.feedback.repository.DashboardRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

import org.smecrow.feedback.model.User;

@Component
public class TotalByDoneStatProcessor implements StatProcessor {

    private final DashboardRepository repository;

    public TotalByDoneStatProcessor(DashboardRepository repository) {
        this.repository = repository;
    }

    @Override
    public void process(Map<String, Object> stats, DashboardFilter filter, User user) {
        Reason reasonEnum = null;
        if (filter.reason() != null && !filter.reason().isEmpty()) {
            try {
                reasonEnum = Reason.valueOf(filter.reason());
            } catch (IllegalArgumentException e) {
                // ignore
            }
        }

        // Current Period
        List<Object[]> results = repository.countByDoneWithFilter(user, filter.startDate(), filter.endDate(), reasonEnum);
        long doneCount = 0;
        long notDoneCount = 0;
        for (Object[] result : results) {
            Boolean isDone = (Boolean) result[0];
            Long count = (Long) result[1];
            if (Boolean.TRUE.equals(isDone)) doneCount = count;
            else notDoneCount = count;
        }
        stats.put("totalDone", doneCount);
        stats.put("totalNotDone", notDoneCount);

        // Previous Period Trend
        if (filter.startDate() != null && filter.endDate() != null) {
            java.time.Duration duration = java.time.Duration.between(filter.startDate(), filter.endDate());
            java.time.LocalDateTime prevStart = filter.startDate().minus(duration);
            java.time.LocalDateTime prevEnd = filter.startDate();

            List<Object[]> prevResults = repository.countByDoneWithFilter(user, prevStart, prevEnd, reasonEnum);
            long prevDone = 0;
            long prevNotDone = 0;
            for (Object[] result : prevResults) {
                Boolean isDone = (Boolean) result[0];
                Long count = (Long) result[1];
                if (Boolean.TRUE.equals(isDone)) prevDone = count;
                else prevNotDone = count;
            }

            stats.put("totalDone_trend", calculateTrend(doneCount, prevDone));
            stats.put("totalNotDone_trend", calculateTrend(notDoneCount, prevNotDone));
        }
    }

    private double calculateTrend(long current, long previous) {
        if (previous == 0) return current > 0 ? 100.0 : 0.0;
        return ((double) (current - previous) / previous) * 100;
    }
}
