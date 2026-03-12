package org.smecrow.feedback.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.smecrow.feedback.dto.AuthResponse;
import org.smecrow.feedback.dto.LoginRequest;
import org.smecrow.feedback.exceptions.NotAllowedException;
import org.smecrow.feedback.model.RefreshToken;
import org.smecrow.feedback.model.User;
import org.smecrow.feedback.repository.RefreshTokenRepository;
import org.smecrow.feedback.repository.UserRepository;
import org.smecrow.feedback.security.JwtTokenProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @InjectMocks
    private AuthService authService;

    @Test
    void shouldLoginWithValidCredentials() {
        User user = buildUser(1L, "smecrow", "smecrow@email.com", "encoded-password");
        RefreshToken savedRefreshToken = new RefreshToken(1L, user, "refresh-token", Instant.now().plusSeconds(3600));

        when(userRepository.findByEmailIgnoreCaseOrUsernameIgnoreCase("smecrow", "smecrow")).thenReturn(Optional.of(user));
        when(refreshTokenRepository.findByUser(user)).thenReturn(Optional.empty());
        when(passwordEncoder.matches("senha-segura", "encoded-password")).thenReturn(true);
        when(jwtTokenProvider.generateToken(user)).thenReturn("jwt-token");
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenReturn(savedRefreshToken);

        AuthResponse response = authService.login(new LoginRequest("smecrow", "senha-segura"));

        assertEquals("jwt-token", response.token());
        assertEquals("refresh-token", response.refreshToken());
        assertEquals("smecrow", response.username());
        assertEquals("smecrow@email.com", response.email());
        verify(refreshTokenRepository, never()).deleteByUser(user);
    }

    @Test
    void shouldRejectLoginWithInvalidPassword() {
        User user = buildUser(1L, "smecrow", "smecrow@email.com", "encoded-password");

        when(userRepository.findByEmailIgnoreCaseOrUsernameIgnoreCase("smecrow", "smecrow")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("senha-incorreta", "encoded-password")).thenReturn(false);

        BadCredentialsException exception = assertThrows(
                BadCredentialsException.class,
                () -> authService.login(new LoginRequest("smecrow", "senha-incorreta"))
        );

        assertEquals("Senha incorreta", exception.getMessage());
    }

    @Test
    void shouldLoginWithTrimmedIdentifierIgnoringCase() {
        User user = buildUser(1L, "smecrow", "smecrowl9@gmail.com", "encoded-password");
        RefreshToken savedRefreshToken = new RefreshToken(1L, user, "refresh-token", Instant.now().plusSeconds(3600));

        when(userRepository.findByEmailIgnoreCaseOrUsernameIgnoreCase("SMECROWL9@GMAIL.COM", "SMECROWL9@GMAIL.COM"))
                .thenReturn(Optional.of(user));
        when(refreshTokenRepository.findByUser(user)).thenReturn(Optional.empty());
        when(passwordEncoder.matches("senha-segura", "encoded-password")).thenReturn(true);
        when(jwtTokenProvider.generateToken(user)).thenReturn("jwt-token");
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenReturn(savedRefreshToken);

        AuthResponse response = authService.login(new LoginRequest("  SMECROWL9@GMAIL.COM  ", "senha-segura"));

        assertEquals("jwt-token", response.token());
        assertEquals("smecrow", response.username());
        verify(refreshTokenRepository, never()).deleteByUser(user);
    }

    @Test
    void shouldReuseExistingRefreshTokenRecordWhenUserLogsInAgain() {
        User user = buildUser(1L, "smecrow", "smecrow@email.com", "encoded-password");
        RefreshToken existingRefreshToken = new RefreshToken(10L, user, "old-refresh-token", Instant.now().plusSeconds(60));

        when(userRepository.findByEmailIgnoreCaseOrUsernameIgnoreCase("smecrow", "smecrow")).thenReturn(Optional.of(user));
        when(refreshTokenRepository.findByUser(user)).thenReturn(Optional.of(existingRefreshToken));
        when(passwordEncoder.matches("senha-segura", "encoded-password")).thenReturn(true);
        when(jwtTokenProvider.generateToken(user)).thenReturn("jwt-token");
        when(refreshTokenRepository.save(existingRefreshToken)).thenReturn(existingRefreshToken);

        AuthResponse response = authService.login(new LoginRequest("smecrow", "senha-segura"));

        assertEquals("jwt-token", response.token());
        assertEquals(existingRefreshToken.getToken(), response.refreshToken());
        verify(refreshTokenRepository, never()).deleteByUser(user);
    }

    @Test
    void shouldRefreshTokenWhenItIsValid() {
        User user = buildUser(1L, "smecrow", "smecrow@email.com", "encoded-password");
        RefreshToken refreshToken = new RefreshToken(1L, user, "refresh-token", Instant.now().plusSeconds(3600));

        when(refreshTokenRepository.findByToken("refresh-token")).thenReturn(Optional.of(refreshToken));
        when(jwtTokenProvider.generateToken(user)).thenReturn("novo-jwt");

        AuthResponse response = authService.refreshToken("refresh-token");

        assertEquals("novo-jwt", response.token());
        assertEquals("refresh-token", response.refreshToken());
        assertEquals("smecrow", response.username());
    }

    @Test
    void shouldRejectExpiredRefreshToken() {
        User user = buildUser(1L, "smecrow", "smecrow@email.com", "encoded-password");
        RefreshToken expiredToken = new RefreshToken(1L, user, "refresh-token", Instant.now().minusSeconds(60));

        when(refreshTokenRepository.findByToken("refresh-token")).thenReturn(Optional.of(expiredToken));

        NotAllowedException exception = assertThrows(
                NotAllowedException.class,
                () -> authService.refreshToken("refresh-token")
        );

        assertTrue(exception.getMessage().contains("expirado"));
        verify(refreshTokenRepository).delete(expiredToken);
    }

    private User buildUser(Long id, String username, String email, String password) {
        User user = new User();
        user.setId(id);
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(password);
        user.setCreatedAt(LocalDateTime.now());
        return user;
    }
}
