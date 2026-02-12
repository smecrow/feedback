package org.smecrow.feedback.stats;

import lombok.extern.slf4j.Slf4j;
import org.smecrow.feedback.dto.DashboardFilter;
import org.smecrow.feedback.interfaces.StatProcessor;
import org.smecrow.feedback.repository.DashboardRepository;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

import org.smecrow.feedback.model.User;

@Slf4j
@Component
public class TotalByClientStatProcessor implements StatProcessor {

    private final DashboardRepository repository;

    public TotalByClientStatProcessor(DashboardRepository repository) {
        this.repository = repository;
    }

    @Override
    public void process(Map<String, Object> stats, DashboardFilter filter, User user) {

        if (filter.client() != null && !filter.client().isBlank()) {
            log.info("Procurando OS pelo cliente: {}.", filter.client());

            String client = filter.client();
            long count = repository.countByUserAndClient(user, client);
            
            if (count > 0) {
                Map<String, Long> clientsMap = new HashMap<>();
                clientsMap.put(client, count);
                log.info("Foram encontradas no total de {} OS pelo cliente informado.", count);
                stats.put("totalByClients", clientsMap);
            }
        }
    }
}
