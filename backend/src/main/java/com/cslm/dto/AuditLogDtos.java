package com.cslm.dto;

import java.time.LocalDateTime;

public class AuditLogDtos {
    public record AuditLogResponse(
            Long id, String username, String action, String entityName, String entityId,
            String fieldName, String oldValue, String newValue, LocalDateTime timestamp
    ) {}
}
