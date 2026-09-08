package com.cslm.service;

import com.cslm.audit.AuditService;
import com.cslm.domain.SystemSetting;
import com.cslm.dto.SystemSettingDtos.SystemSettingRequest;
import com.cslm.dto.SystemSettingDtos.SystemSettingResponse;
import com.cslm.exception.ResourceNotFoundException;
import com.cslm.repository.SystemSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SystemSettingService {

    private final SystemSettingRepository systemSettingRepository;
    private final AuditService auditService;

    public List<SystemSettingResponse> findAll() {
        return systemSettingRepository.findAll().stream().map(this::toResponse).toList();
    }

    public SystemSettingResponse update(String key, SystemSettingRequest request) {
        SystemSetting setting = systemSettingRepository.findBySettingKey(key)
                .orElseThrow(() -> new ResourceNotFoundException("Setting not found: " + key));
        auditService.logFieldChange("SystemSetting", key, "value", setting.getSettingValue(), request.value());
        setting.setSettingValue(request.value());
        return toResponse(systemSettingRepository.save(setting));
    }

    private SystemSettingResponse toResponse(SystemSetting s) {
        return new SystemSettingResponse(s.getId(), s.getSettingKey(), s.getSettingValue(), s.getDescription());
    }
}
