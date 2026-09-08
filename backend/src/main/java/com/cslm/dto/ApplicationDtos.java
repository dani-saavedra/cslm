package com.cslm.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

public class ApplicationDtos {

    public record ApplicationResponse(
            Long id, String name, String code, String description, String area,
            Long teamId, String teamName, String owner, String ownerEmail,
            String criticality, String status,
            LocalDateTime createdAt, LocalDateTime updatedAt
    ) {}

    public record ApplicationRequest(
            @NotBlank String name, @NotBlank String code, String description, String area,
            Long teamId, String owner, String ownerEmail, String criticality, String status
    ) {}
}
