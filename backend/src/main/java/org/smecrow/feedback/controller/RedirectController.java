package org.smecrow.feedback.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class RedirectController {

    @GetMapping("/")
    public String root() {
        return "redirect:/home.html";
    }
}
