package org.smecrow.feedback.stats;

import org.smecrow.feedback.dto.DashboardFilter;
import org.smecrow.feedback.interfaces.StatProcessor;
import org.smecrow.feedback.model.Reason;
import org.smecrow.feedback.repository.DashboardRepository;
import org.springframework.stereotype.Component;

import java.util.Map;

import org.smecrow.feedback.model.User;

@Component
public class TotalStatProcessor implements StatProcessor {

    private final DashboardRepository repository;

    public TotalStatProcessor(DashboardRepository repository) {
        this.repository = repository;
    }

    @Override
    public void process(Map<String, Object> stats, DashboardFilter filter, User user) {
        Reason reasonEnum = null;
        if (filter.reason() != null && !filter.reason().isEmpty()) {
            try {
                reasonEnum = org.smecrow.feedback.model.Reason.valueOf(filter.reason());
            } catch (IllegalArgumentException e) {
            }
        }

        long currentCount = repository.countByFilter(user, filter.startDate(), filter.endDate(), filter.status(), reasonEnum);
        stats.put("totalOs", currentCount);

        if (filter.startDate() != null && filter.endDate() != null) {
            java.time.Duration duration = java.time.Duration.between(filter.startDate(), filter.endDate());
            java.time.LocalDateTime prevStart = filter.startDate().minus(duration);
            java.time.LocalDateTime prevEnd = filter.startDate();
            
            long prevCount = repository.countByFilter(user, prevStart, prevEnd, filter.status(), reasonEnum);
            
            double trend = 0.0;
            if (prevCount > 0) {
                trend = ((double) (currentCount - prevCount) / prevCount) * 100;
            } else if (currentCount > 0) {
                trend = 100.0;
            }
            stats.put("totalOs_trend", trend);
        }
    }
}
