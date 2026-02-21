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
public class TotalByStatusStatProcessor implements StatProcessor {

    private final DashboardRepository repository;

    public TotalByStatusStatProcessor(DashboardRepository repository) {
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
        List<Object[]> results = repository.countByStatusWithFilter(user, filter.startDate(), filter.endDate(), reasonEnum);
        long doneCount = 0;
        long notDoneCount = 0;
        
        Map<String, Long> statusMap = new java.util.HashMap<>();
        
        for (Object[] result : results) {
            org.smecrow.feedback.model.OsStatus status = (org.smecrow.feedback.model.OsStatus) result[0];
            Long count = (Long) result[1];
            
            statusMap.put(status.name(), count);
            
            if (status != org.smecrow.feedback.model.OsStatus.PENDENTE) doneCount += count;
            else notDoneCount += count;
        }
        stats.put("totalDone", doneCount);
        stats.put("totalNotDone", notDoneCount);
        stats.put("totalByStatus", statusMap);

        // Previous Period Trend
        if (filter.startDate() != null && filter.endDate() != null) {
            java.time.Duration duration = java.time.Duration.between(filter.startDate(), filter.endDate());
            java.time.LocalDateTime prevStart = filter.startDate().minus(duration);
            java.time.LocalDateTime prevEnd = filter.startDate();

            List<Object[]> prevResults = repository.countByStatusWithFilter(user, prevStart, prevEnd, reasonEnum);
            long prevDone = 0;
            long prevNotDone = 0;
            for (Object[] result : prevResults) {
                org.smecrow.feedback.model.OsStatus status = (org.smecrow.feedback.model.OsStatus) result[0];
                Long count = (Long) result[1];
                if (status != org.smecrow.feedback.model.OsStatus.PENDENTE) prevDone += count;
                else prevNotDone += count;
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
