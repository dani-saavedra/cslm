package com.cslm.service;

import com.cslm.domain.AuditLog;
import com.cslm.dto.AuditLogDtos.AuditLogResponse;
import com.cslm.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public Page<AuditLogResponse> findAll(String entityName, String entityId, Pageable pageable) {
        Page<AuditLog> page = (entityName != null && entityId != null)
                ? auditLogRepository.findByEntityNameAndEntityIdOrderByTimestampDesc(entityName, entityId, pageable)
                : auditLogRepository.findAllByOrderByTimestampDesc(pageable);
        return page.map(this::toResponse);
    }

    private AuditLogResponse toResponse(AuditLog a) {
        return new AuditLogResponse(a.getId(), a.getUsername(), a.getAction(), a.getEntityName(), a.getEntityId(),
                a.getFieldName(), a.getOldValue(), a.getNewValue(), a.getTimestamp());
    }
}
