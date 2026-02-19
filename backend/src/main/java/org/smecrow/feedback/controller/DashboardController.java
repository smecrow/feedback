package org.smecrow.feedback.controller;

import lombok.extern.slf4j.Slf4j;
import org.smecrow.feedback.dto.DashboardFilter;
import org.smecrow.feedback.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService service;

    public DashboardController(DashboardService service) {
        this.service = service;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(DashboardFilter filter) {
        log.info("Retornando os dados com o filtro: {}.", filter);
        return ResponseEntity.ok(service.getStats(filter));
    }
}
