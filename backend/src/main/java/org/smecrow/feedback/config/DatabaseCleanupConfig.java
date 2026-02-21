package org.smecrow.feedback.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class DatabaseCleanupConfig {

    @Bean
    public CommandLineRunner dropConstraints(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                jdbcTemplate.execute("ALTER TABLE os DROP CONSTRAINT IF EXISTS os_reason_check");
                jdbcTemplate.execute("ALTER TABLE os DROP COLUMN IF EXISTS done");
                System.out.println("Database Cleanup: Removed os_reason_check constraint and done column successfully.");
            } catch (Exception e) {
                System.out.println("Database Cleanup: Cleanup skipped or failed: " + e.getMessage());
            }
        };
    }
}
