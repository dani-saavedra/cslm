package com.cslm.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

public class TeamDtos {
    public record TeamResponse(Long id, String name, String description, Boolean active,
                                LocalDateTime createdAt, LocalDateTime updatedAt) {}

    public record TeamRequest(@NotBlank String name, String description, Boolean active) {}
}
