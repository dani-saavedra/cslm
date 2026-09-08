package com.cslm.dto;

import jakarta.validation.constraints.NotBlank;

public class SystemSettingDtos {
    public record SystemSettingResponse(Long id, String key, String value, String description) {}

    public record SystemSettingRequest(@NotBlank String value) {}
}
