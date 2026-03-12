package org.smecrow.feedback;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import io.github.cdimascio.dotenv.Dotenv;

import java.util.HashMap;
import java.util.Map;

@SpringBootApplication
public class FeedbackApplication {

    public static void main(String[] args) {
        Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
        Map<String, Object> defaultProperties = new HashMap<>();

        dotenv.entries().forEach(entry -> {
            System.setProperty(entry.getKey(), entry.getValue());

            if ("SPRING_PROFILES_ACTIVE".equals(entry.getKey())) {
                defaultProperties.put("spring.profiles.active", entry.getValue());
            }
        });

        SpringApplication application = new SpringApplication(FeedbackApplication.class);
        if (!defaultProperties.isEmpty()) {
            application.setDefaultProperties(defaultProperties);
        }

        application.run(args);
    }

}
