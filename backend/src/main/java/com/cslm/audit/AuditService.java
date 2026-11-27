package com.cslm.audit;

import com.cslm.domain.AuditLog;
import com.cslm.repository.AuditLogRepository;
import com.cslm.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logCreate(String entityName, Object entityId) {
        save("CREATE", entityName, entityId, null, null, null);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logDelete(String entityName, Object entityId) {
        save("DELETE", entityName, entityId, null, null, null);
    }

    /**
     * Compares old/new field values via a set of (fieldName, oldValue, newValue) triples
     * and writes one audit row per changed field.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logFieldChange(String entityName, Object entityId, String fieldName, Object oldValue, Object newValue) {
        if (Objects.equals(oldValue, newValue)) {
            return;
        }
        save("UPDATE", entityName, entityId, fieldName,
                oldValue == null ? null : oldValue.toString(),
                newValue == null ? null : newValue.toString());
    }

    private void save(String action, String entityName, Object entityId, String fieldName, String oldValue, String newValue) {
        AuditLog log = AuditLog.builder()
                .username(CurrentUser.username())
                .action(action)
                .entityName(entityName)
                .entityId(entityId == null ? null : entityId.toString())
                .fieldName(fieldName)
                .oldValue(truncate(oldValue))
                .newValue(truncate(newValue))
                .build();
        auditLogRepository.save(log);
    }

    private String truncate(String value) {
        if (value != null && value.length() > 2000) {
            return value.substring(0, 2000);
        }
        return value;
    }
}
