package org.smecrow.feedback.controller;

import jakarta.validation.Valid;

import org.smecrow.feedback.dto.OsImportRequest;
import org.smecrow.feedback.dto.OsMarkDoneRequest;
import org.smecrow.feedback.dto.OsRequest;
import org.smecrow.feedback.dto.OsResponse;
import org.smecrow.feedback.service.OsService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/os/")
public class OsController {

    private final OsService osService;

    public OsController(OsService osService) {
        this.osService = osService;
    }

    @PostMapping("/createOs")
    public ResponseEntity<OsResponse> createOs(@RequestBody @Valid OsRequest request, Authentication authentication) {
        return ResponseEntity.ok(osService.createOs(request, authentication));
    }

    @PostMapping("/import")
    public ResponseEntity<OsResponse> importOs(@RequestBody @Valid OsImportRequest request, Authentication authentication) {
        return ResponseEntity.ok(osService.importOs(request, authentication));
    }

    @GetMapping("/getAllOs")
    public ResponseEntity<Page<OsResponse>> getAllOs(@PageableDefault(size = 10, page = 0, sort = "done") Pageable pageable) {
        return ResponseEntity.ok(osService.getAllOs(pageable));
    }

    @GetMapping("/getByClient")
    public ResponseEntity<Page<OsResponse>> getByClient(@PageableDefault(size = 10, page = 0, sort = "done") Pageable pageable, @RequestParam String client) {
        return ResponseEntity.ok(osService.getByClient(pageable, client));
    }

    @GetMapping("/getByReason")
    public ResponseEntity<Page<OsResponse>> getByReason(@PageableDefault(size = 10, page = 0, sort = "client") Pageable pageable, @RequestParam String reason) {
        return ResponseEntity.ok(osService.getByReason(pageable, reason));
    }

    @GetMapping("/getByDone")
    public ResponseEntity<Page<OsResponse>> getByDone(@PageableDefault(size = 10, page = 0, sort = "client") Pageable pageable, @RequestParam(defaultValue = "true") Boolean done) {
        return ResponseEntity.ok(osService.getByDone(pageable, done));
    }

    @GetMapping("/getByMonth")
    public ResponseEntity<Page<OsResponse>> getPerMonth(@PageableDefault(size = 10, page = 0, sort = "client") Pageable pageable, @RequestParam int month, @RequestParam int year) {
        return ResponseEntity.ok(osService.getPerMonth(month, year, pageable));
    }

    @PutMapping("/done/{id}")
    public ResponseEntity<OsResponse> markDone(@PathVariable Long id, @RequestBody OsMarkDoneRequest done) {
        return ResponseEntity.ok(osService.markDone(id, done));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteOs(@PathVariable Long id, Authentication authentication) {
        osService.deleteOs(id, authentication);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/deleteAll")
    public ResponseEntity<Void> deleteAllOs() {
        osService.deleteAllOs();
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<OsResponse> updateOs(@PathVariable Long id, @RequestBody @Valid OsRequest request, Authentication authentication) {
        return ResponseEntity.ok(osService.updateOs(id, request, authentication));
    }
}
