package org.smecrow.feedback.interfaces;

import org.smecrow.feedback.dto.DashboardFilter;

import java.util.Map;

import org.smecrow.feedback.model.User;

public interface StatProcessor {
    void process(Map<String, Object> stats, DashboardFilter filter, User user);
}
