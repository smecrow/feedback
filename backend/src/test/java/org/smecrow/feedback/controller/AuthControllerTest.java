package org.smecrow.feedback.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.smecrow.feedback.dto.AuthResponse;
import org.smecrow.feedback.dto.LoginRequest;
import org.smecrow.feedback.dto.RegisterRequest;
import org.smecrow.feedback.security.JwtTokenProvider;
import org.smecrow.feedback.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.smecrow.feedback.security.SecurityConfig;
import org.smecrow.feedback.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;

@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, ObjectMapper.class})
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private UserDetailsService userDetailsService;

    @Test
    @DisplayName("Deve realizar login com sucesso e retornar token")
    void loginSuccess() throws Exception {
        // Arrange
        LoginRequest loginRequest = new LoginRequest("usuario@email.com", "senha123");
        AuthResponse authResponse = new AuthResponse("token.jwt.valido", "usuario", "usuario@email.com");

        given(authService.login(any(LoginRequest.class))).willReturn(authResponse);

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("token.jwt.valido"))
                .andExpect(jsonPath("$.username").value("usuario"));
    }

    @Test
    @DisplayName("Deve registrar novo usuário com sucesso")
    void registerSuccess() throws Exception {
        // Arrange
        RegisterRequest registerRequest = new RegisterRequest("novousuario", "novo@email.com", "senha123");
        AuthResponse authResponse = new AuthResponse("token.jwt.novo", "novousuario", "novo@email.com");

        given(authService.register(any(RegisterRequest.class))).willReturn(authResponse);

        // Act & Assert
        mockMvc.perform(post("/api/auth/register")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value("token.jwt.novo"));
    }
}