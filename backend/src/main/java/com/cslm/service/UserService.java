package com.cslm.service;

import com.cslm.audit.AuditService;
import com.cslm.domain.Role;
import com.cslm.domain.User;
import com.cslm.dto.UserDtos.CreateUserRequest;
import com.cslm.dto.UserDtos.UpdateUserRequest;
import com.cslm.dto.UserDtos.UserResponse;
import com.cslm.exception.BadRequestException;
import com.cslm.exception.ResourceNotFoundException;
import com.cslm.repository.RoleRepository;
import com.cslm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public List<UserResponse> findAll() {
        return userRepository.findAll().stream().map(this::toResponse).toList();
    }

    public UserResponse create(CreateUserRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new BadRequestException("Username already in use: " + request.username());
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new BadRequestException("Email already in use: " + request.email());
        }
        User user = User.builder()
                .username(request.username())
                .email(request.email())
                .fullName(request.fullName())
                .passwordHash(passwordEncoder.encode(request.password()))
                .active(true)
                .roles(resolveRoles(request.roles()))
                .build();
        user = userRepository.save(user);
        auditService.logCreate("User", user.getId());
        return toResponse(user);
    }

    public UserResponse update(Long id, UpdateUserRequest request) {
        User user = getEntity(id);
        auditService.logFieldChange("User", id, "active", user.getActive(), request.active());
        if (request.email() != null) user.setEmail(request.email());
        if (request.fullName() != null) user.setFullName(request.fullName());
        if (request.active() != null) user.setActive(request.active());
        if (request.password() != null && !request.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        }
        if (request.roles() != null) {
            user.setRoles(resolveRoles(request.roles()));
        }
        return toResponse(userRepository.save(user));
    }

    public void delete(Long id) {
        User user = getEntity(id);
        userRepository.delete(user);
        auditService.logDelete("User", id);
    }

    private Set<Role> resolveRoles(List<String> roleNames) {
        Set<Role> roles = new HashSet<>();
        for (String name : roleNames) {
            roles.add(roleRepository.findByName(name)
                    .orElseThrow(() -> new BadRequestException("Unknown role: " + name)));
        }
        return roles;
    }

    private User getEntity(Long id) {
        return userRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("User", id));
    }

    private UserResponse toResponse(User u) {
        return new UserResponse(u.getId(), u.getUsername(), u.getEmail(), u.getFullName(), u.getActive(),
                u.getRoles().stream().map(Role::getName).collect(Collectors.toSet()),
                u.getCreatedAt(), u.getUpdatedAt());
    }
}
