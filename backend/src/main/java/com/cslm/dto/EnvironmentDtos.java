package com.cslm.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

public class EnvironmentDtos {
    public record EnvironmentResponse(Long id, String name, String code, String description,
                                       Boolean production, Integer sortOrder, Boolean active,
                                       LocalDateTime createdAt, LocalDateTime updatedAt) {}

    public record EnvironmentRequest(@NotBlank String name, @NotBlank String code, String description,
                                      Boolean production, Integer sortOrder, Boolean active) {}
}
