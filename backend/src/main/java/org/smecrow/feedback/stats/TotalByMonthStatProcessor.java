package org.smecrow.feedback.stats;

import lombok.extern.slf4j.Slf4j;
import org.smecrow.feedback.dto.DashboardFilter;
import org.smecrow.feedback.interfaces.StatProcessor;
import org.smecrow.feedback.model.Reason;
import org.smecrow.feedback.repository.DashboardRepository;
import org.springframework.stereotype.Component;


import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.smecrow.feedback.model.User;

@Slf4j
@Component
public class TotalByMonthStatProcessor implements StatProcessor {

    private final DashboardRepository repository;

    public TotalByMonthStatProcessor(DashboardRepository repository) {
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

        List<Object[]> results = repository.countByMonthWithFilter(user, filter.startDate(), filter.endDate(), filter.done(), reasonEnum);
        
        Map<String, Long> monthsMap = new LinkedHashMap<>();
        for (Object[] result : results) {
            Number monthNum = (Number) result[0]; // Can be Integer or Long or Double depending on DB
            Long count = (Long) result[1];
            
            if (monthNum != null) {
                String monthName = java.time.Month.of(monthNum.intValue()).name();
                monthsMap.put(monthName, count);
            }
        }

        stats.put("totalByMonths", monthsMap);
    }
}
