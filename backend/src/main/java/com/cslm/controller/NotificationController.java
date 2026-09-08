package com.cslm.controller;

import com.cslm.dto.NotificationDtos.*;
import com.cslm.service.NotificationHistoryService;
import com.cslm.service.NotificationRuleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationHistoryService notificationHistoryService;
    private final NotificationRuleService notificationRuleService;

    @GetMapping
    public Page<NotificationHistoryResponse> history(Pageable pageable) {
        return notificationHistoryService.findAll(pageable);
    }

    @PostMapping("/test")
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public NotificationHistoryResponse test(@Valid @RequestBody TestNotificationRequest request) {
        return notificationHistoryService.sendTest(request);
    }

    @GetMapping("/rules")
    public List<NotificationRuleResponse> rules() {
        return notificationRuleService.findAll();
    }

    @PostMapping("/rules")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public NotificationRuleResponse createRule(@Valid @RequestBody NotificationRuleRequest request) {
        return notificationRuleService.create(request);
    }

    @PutMapping("/rules/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public NotificationRuleResponse updateRule(@PathVariable Long id, @Valid @RequestBody NotificationRuleRequest request) {
        return notificationRuleService.update(id, request);
    }

    @DeleteMapping("/rules/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteRule(@PathVariable Long id) {
        notificationRuleService.delete(id);
    }
}
