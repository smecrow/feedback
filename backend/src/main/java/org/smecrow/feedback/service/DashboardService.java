package org.smecrow.feedback.service;

import org.smecrow.feedback.dto.DashboardFilter;
import org.smecrow.feedback.interfaces.StatProcessor;
import org.smecrow.feedback.model.User;
import org.smecrow.feedback.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {
    private final List<StatProcessor> processors;
    private final UserRepository userRepository;

    public DashboardService(List<StatProcessor> processors, UserRepository userRepository) {
        this.processors = processors;
        this.userRepository = userRepository;
    }

    public Map<String, Object> getStats(DashboardFilter filter) {
        Map<String, Object> stats = new HashMap<>();
        User user = getLoggedUser();

        for (StatProcessor processor : processors) {
            processor.process(stats, filter, user);
        }

        return stats;
    }

    private User getLoggedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Object principal = authentication.getPrincipal();

        String userEmail;
        if (principal instanceof UserDetails) {
            userEmail = ((UserDetails) principal).getUsername();
        } else {
            userEmail = principal.toString();
        }

        return userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Usuário logado não encontrado"));
    }
}
