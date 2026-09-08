package com.cslm.service;

import com.cslm.audit.AuditService;
import com.cslm.domain.NotificationRule;
import com.cslm.dto.NotificationDtos.NotificationRuleRequest;
import com.cslm.dto.NotificationDtos.NotificationRuleResponse;
import com.cslm.exception.ResourceNotFoundException;
import com.cslm.repository.NotificationRuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationRuleService {

    private final NotificationRuleRepository notificationRuleRepository;
    private final AuditService auditService;

    public List<NotificationRuleResponse> findAll() {
        return notificationRuleRepository.findAll().stream().map(this::toResponse).toList();
    }

    public NotificationRuleResponse create(NotificationRuleRequest request) {
        NotificationRule rule = NotificationRule.builder()
                .name(request.name())
                .assetCategory(request.assetCategory().toUpperCase())
                .daysBefore(request.daysBefore())
                .enabled(request.enabled() == null || request.enabled())
                .build();
        rule = notificationRuleRepository.save(rule);
        auditService.logCreate("NotificationRule", rule.getId());
        return toResponse(rule);
    }

    public NotificationRuleResponse update(Long id, NotificationRuleRequest request) {
        NotificationRule rule = getEntity(id);
        auditService.logFieldChange("NotificationRule", id, "enabled", rule.getEnabled(), request.enabled());
        auditService.logFieldChange("NotificationRule", id, "daysBefore", rule.getDaysBefore(), request.daysBefore());
        rule.setName(request.name());
        rule.setAssetCategory(request.assetCategory().toUpperCase());
        rule.setDaysBefore(request.daysBefore());
        if (request.enabled() != null) rule.setEnabled(request.enabled());
        return toResponse(notificationRuleRepository.save(rule));
    }

    public void delete(Long id) {
        NotificationRule rule = getEntity(id);
        notificationRuleRepository.delete(rule);
        auditService.logDelete("NotificationRule", id);
    }

    private NotificationRule getEntity(Long id) {
        return notificationRuleRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("NotificationRule", id));
    }

    private NotificationRuleResponse toResponse(NotificationRule r) {
        return new NotificationRuleResponse(r.getId(), r.getName(), r.getAssetCategory(), r.getDaysBefore(),
                r.getEnabled(), r.getCreatedAt(), r.getUpdatedAt());
    }
}
