package org.smecrow.feedback.stats;

import lombok.extern.slf4j.Slf4j;
import org.smecrow.feedback.dto.DashboardFilter;
import org.smecrow.feedback.interfaces.StatProcessor;
import org.smecrow.feedback.model.Os;
import org.smecrow.feedback.model.User;
import org.smecrow.feedback.repository.DashboardRepository;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class LatestOsStatProcessor implements StatProcessor {

    private final DashboardRepository repository;

    public LatestOsStatProcessor(DashboardRepository repository) {
        this.repository = repository;
    }

    @Override
    public void process(Map<String, Object> stats, DashboardFilter filter, User user) {
        log.info("Buscando últimas 5 OSs do usuário com filtro.");
        
        org.smecrow.feedback.model.Reason reasonEnum = null;
        if (filter.reason() != null && !filter.reason().isEmpty()) {
            try {
                reasonEnum = org.smecrow.feedback.model.Reason.valueOf(filter.reason());
            } catch (IllegalArgumentException e) {}
        }

        List<Os> latestOs = repository.findLatestWithFilter(user, filter.startDate(), filter.endDate(), filter.status(), reasonEnum, org.springframework.data.domain.PageRequest.of(0, 5));
        
        List<Map<String, Object>> simpleList = new ArrayList<>();
        
        for (Os os : latestOs) {
            Map<String, Object> item = new HashMap<>();
            item.put("client", os.getClient());
            item.put("reason", os.getReason().name());
            item.put("createdAt", os.getCreatedAt());
            item.put("status", os.getStatus());
            item.put("done", os.getStatus() != org.smecrow.feedback.model.OsStatus.PENDENTE);
            simpleList.add(item);
        }
        
        stats.put("latestOs", simpleList);
    }
}
