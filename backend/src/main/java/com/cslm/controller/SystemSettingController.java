package com.cslm.controller;

import com.cslm.dto.SystemSettingDtos.SystemSettingRequest;
import com.cslm.dto.SystemSettingDtos.SystemSettingResponse;
import com.cslm.service.SystemSettingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/settings")
@RequiredArgsConstructor
public class SystemSettingController {

    private final SystemSettingService systemSettingService;

    @GetMapping
    public List<SystemSettingResponse> findAll() {
        return systemSettingService.findAll();
    }

    @PutMapping("/{key}")
    @PreAuthorize("hasRole('ADMIN')")
    public SystemSettingResponse update(@PathVariable String key, @Valid @RequestBody SystemSettingRequest request) {
        return systemSettingService.update(key, request);
    }
}
