package com.cslm.service;

import com.cslm.domain.Role;
import com.cslm.domain.User;
import com.cslm.dto.AuthDtos.LoginRequest;
import com.cslm.dto.AuthDtos.LoginResponse;
import com.cslm.repository.UserRepository;
import com.cslm.security.JwtProperties;
import com.cslm.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final JwtProperties jwtProperties;

    public LoginResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password()));

        User user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));

        List<String> roles = user.getRoles().stream().map(Role::getName).collect(Collectors.toList());
        String token = jwtUtil.generateToken(user.getUsername(), roles);
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(jwtProperties.getExpirationMinutes());

        return new LoginResponse(token, user.getUsername(), roles, expiresAt);
    }
}
