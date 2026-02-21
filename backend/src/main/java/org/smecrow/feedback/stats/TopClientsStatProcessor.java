package org.smecrow.feedback.stats;

import lombok.extern.slf4j.Slf4j;
import org.smecrow.feedback.dto.DashboardFilter;
import org.smecrow.feedback.interfaces.StatProcessor;
import org.smecrow.feedback.model.Reason;
import org.smecrow.feedback.model.User;
import org.smecrow.feedback.repository.DashboardRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class TopClientsStatProcessor implements StatProcessor {

    private final DashboardRepository repository;

    public TopClientsStatProcessor(DashboardRepository repository) {
        this.repository = repository;
    }

    @Override
    public void process(Map<String, Object> stats, DashboardFilter filter, User user) {
        log.info("Processando Top 5 Clientes com filtros.");
        
        Reason reasonEnum = null;
        if (filter.reason() != null && !filter.reason().isEmpty()) {
            try {
                reasonEnum = Reason.valueOf(filter.reason());
            } catch (IllegalArgumentException e) {}
        }

        // Fetch top 5 clients using filters
        List<Object[]> results = repository.findTopClientsWithFilter(user, filter.startDate(), filter.endDate(), filter.status(), reasonEnum, PageRequest.of(0, 5));
        
        Map<String, Long> topClients = new LinkedHashMap<>(); // Maintain order
        for (Object[] result : results) {
            String client = (String) result[0];
            Long count = (Long) result[1];
            topClients.put(client, count);
        }
        
        stats.put("topClients", topClients);
    }
}
