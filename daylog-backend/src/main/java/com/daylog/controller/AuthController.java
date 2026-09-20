package com.daylog.controller;

import com.daylog.dto.AuthResponse;
import com.daylog.dto.LoginRequest;
import com.daylog.dto.LogoutResponse;
import com.daylog.dto.RegisterRequest;
import com.daylog.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public org.springframework.http.ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return org.springframework.http.ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/logout")
    public LogoutResponse logout() {
        return new LogoutResponse("Logged out. Discard the JWT on the client.");
    }
}