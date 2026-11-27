package com.cslm.dto;

import com.cslm.dto.TeamDtos.TeamResponse;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

public class UserDtos {

    public record UserResponse(
            Long id,
            String username,
            String email,
            String fullName,
            Boolean active,
            Set<String> roles,
            Set<TeamResponse> teams,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {}

    public record CreateUserRequest(
            @NotBlank String username,
            @NotBlank @Email String email,
            String fullName,
            @NotBlank String password,
            @NotEmpty List<String> roles,
            List<Long> teamIds
    ) {}

    public record UpdateUserRequest(
            @Email String email,
            String fullName,
            Boolean active,
            String password,
            List<String> roles,
            List<Long> teamIds
    ) {}
}
