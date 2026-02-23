package org.smecrow.feedback.stats;

import org.smecrow.feedback.dto.DashboardFilter;
import org.smecrow.feedback.model.OsStatus;
import org.smecrow.feedback.model.User;
import org.smecrow.feedback.repository.OsRepository;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class AbsolutePendingStatProcessor implements org.smecrow.feedback.interfaces.StatProcessor {
    private final OsRepository osRepository;

    public AbsolutePendingStatProcessor(OsRepository osRepository) {
        this.osRepository = osRepository;
    }

    @Override
    public void process(Map<String, Object> stats, DashboardFilter filter, User user) {
        long absolutePending = osRepository.countByUserAndStatus(user, OsStatus.PENDENTE);
        stats.put("absolutePending", absolutePending);
    }
}
