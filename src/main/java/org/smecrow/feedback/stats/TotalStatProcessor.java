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
                // ignore invalid reason
            }
        }
        
        // Current Period
        long currentCount = repository.countByFilter(user, filter.startDate(), filter.endDate(), filter.done(), reasonEnum);
        stats.put("totalOs", currentCount);
        
        // Previous Period (for trend)
        // If no date filter, we can't really calculate a meaningful trend vs "previous period" because previous is infinity?
        // Or maybe for "All Time", we compare vs "Last 30 Days"? No, let's only show trend if dates are set.
        if (filter.startDate() != null && filter.endDate() != null) {
            java.time.Duration duration = java.time.Duration.between(filter.startDate(), filter.endDate());
            java.time.LocalDateTime prevStart = filter.startDate().minus(duration);
            java.time.LocalDateTime prevEnd = filter.startDate(); // End of previous is Start of current
            
            long prevCount = repository.countByFilter(user, prevStart, prevEnd, filter.done(), reasonEnum);
            
            double trend = 0.0;
            if (prevCount > 0) {
                trend = ((double) (currentCount - prevCount) / prevCount) * 100;
            } else if (currentCount > 0) {
                trend = 100.0; // 0 to something is 100% growth effectively (or infinite)
            }
            stats.put("totalOs_trend", trend);
        }
    }
}
