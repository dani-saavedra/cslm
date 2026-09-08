package com.cslm.controller;

import com.cslm.dto.AuditLogDtos.AuditLogResponse;
import com.cslm.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/audit-log")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    public Page<AuditLogResponse> findAll(@RequestParam(required = false) String entityName,
                                           @RequestParam(required = false) String entityId,
                                           Pageable pageable) {
        return auditLogService.findAll(entityName, entityId, pageable);
    }
}
