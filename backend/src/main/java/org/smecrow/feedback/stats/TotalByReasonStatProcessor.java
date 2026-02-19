package org.smecrow.feedback.stats;

import lombok.extern.slf4j.Slf4j;
import org.smecrow.feedback.dto.DashboardFilter;
import org.smecrow.feedback.interfaces.StatProcessor;
import org.smecrow.feedback.repository.DashboardRepository;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.smecrow.feedback.model.User;

@Slf4j
@Component
public class TotalByReasonStatProcessor implements StatProcessor {

    private final DashboardRepository repository;

    public TotalByReasonStatProcessor(DashboardRepository repository) {
        this.repository = repository;
    }

    @Override
    public void process(Map<String, Object> stats, DashboardFilter filter, User user) {
       List<Object[]> results = repository.countByReasonWithFilter(user, filter.startDate(), filter.endDate(), filter.done());
        
        Map<String, Long> reasonsMap = new HashMap<>();
        for (Object[] result : results) {
            org.smecrow.feedback.model.Reason reason = (org.smecrow.feedback.model.Reason) result[0];
            Long count = (Long) result[1];
            reasonsMap.put(reason.name(), count);
        }
        
        stats.put("totalByReasons", reasonsMap);
    }
}
