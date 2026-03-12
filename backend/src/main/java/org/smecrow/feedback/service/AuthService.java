package org.smecrow.feedback.service;

import lombok.extern.slf4j.Slf4j;
import org.smecrow.feedback.dto.AuthResponse;
import org.smecrow.feedback.dto.LoginRequest;
import org.smecrow.feedback.dto.RegisterRequest;
import org.smecrow.feedback.exceptions.AlreadyExistsException;
import org.smecrow.feedback.exceptions.NotAllowedException;
import org.smecrow.feedback.model.User;
import org.smecrow.feedback.model.RefreshToken;
import org.smecrow.feedback.repository.RefreshTokenRepository;
import org.smecrow.feedback.repository.UserRepository;
import org.smecrow.feedback.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
public class AuthService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private RefreshTokenRepository refreshTokenRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String normalizeIdentifier(String identifier) {
        return identifier == null ? "" : identifier.trim();
    }

    private String normalizeEmail(String email) {
        return normalizeIdentifier(email).toLowerCase(Locale.ROOT);
    }

    private String normalizeUsername(String username) {
        return normalizeIdentifier(username);
    }

    private RefreshToken createRefreshToken(User user) {
        RefreshToken refreshToken = refreshTokenRepository.findByUser(user)
                .orElseGet(() -> {
                    RefreshToken newRefreshToken = new RefreshToken();
                    newRefreshToken.setUser(user);
                    return newRefreshToken;
                });

        refreshToken.setExpiryDate(Instant.now().plus(7, ChronoUnit.DAYS));
        refreshToken.setToken(UUID.randomUUID().toString());

        return refreshTokenRepository.save(refreshToken);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String normalizedLogin = normalizeIdentifier(request.login());

        User user = userRepository.findByEmailIgnoreCaseOrUsernameIgnoreCase(normalizedLogin, normalizedLogin)
                .orElseThrow(() -> new BadCredentialsException("Usuário não encontrado"));

        log.info("Usuário: {} encontrado.", user.getUsername());

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new BadCredentialsException("Senha incorreta");
        }

        log.info("Senha correta. Gerando token JWT.");

        String token = jwtTokenProvider.generateToken(user);
        RefreshToken refreshToken = createRefreshToken(user);

        log.info("Token gerado com sucesso. Retornando resposta.");
        return new AuthResponse(token, refreshToken.getToken(), user.getUsername(), user.getEmail());
    }

    @Transactional

    public AuthResponse register(RegisterRequest request) {
        java.util.List<String> errors = new java.util.ArrayList<>();
        String normalizedEmail = normalizeEmail(request.email());
        String normalizedUsername = normalizeUsername(request.username());

        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            errors.add("Email já cadastrado");
        }

        if (userRepository.existsByUsernameIgnoreCase(normalizedUsername)) {
            errors.add("Nome de usuário já cadastrado");
        }

        if (!errors.isEmpty()) {
            throw new AlreadyExistsException(String.join("\n", errors));
        }

        User user = new User();
        user.setUsername(normalizedUsername);
        log.info("Usuário: {}.", user.getUsername());
        user.setEmail(normalizedEmail);
        log.info("Email: {}.", user.getEmail());
        user.setPassword(passwordEncoder.encode(request.password()));
        log.info("Senha criptografada.");
        user.setCreatedAt(LocalDateTime.now());
        log.info("Hora atual: {}.", LocalDateTime.now());

        userRepository.save(user);

        String token = jwtTokenProvider.generateToken(user);
        RefreshToken refreshToken = createRefreshToken(user);

        log.info("Token gerado com sucesso. Retornando resposta.");
        return new AuthResponse(token, refreshToken.getToken(), user.getUsername(), user.getEmail());
    }

    @Transactional
    public AuthResponse refreshToken(String requestRefreshToken) {
        return refreshTokenRepository.findByToken(requestRefreshToken)
                .map(token -> {
                    if (token.getExpiryDate().compareTo(Instant.now()) < 0) {
                        refreshTokenRepository.delete(token);
                        throw new NotAllowedException("Refresh token expirado. Faça login novamente.");
                    }
                    return token;
                })
                .map(RefreshToken::getUser)
                .map(user -> {
                    String token = jwtTokenProvider.generateToken(user);
                    return new AuthResponse(token, requestRefreshToken, user.getUsername(), user.getEmail());
                })
                .orElseThrow(() -> new NotAllowedException("Refresh token não encontrado no banco de dados!"));
    }

    @Transactional
    public void logout(String refreshToken) {
        refreshTokenRepository.deleteByToken(refreshToken);
    }

    public Map<String, String> validateToken(String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                throw new NotAllowedException("Cabeçalho Authorization ausente ou inválido.");
            }

            String token = authHeader.substring(7);

            if (jwtTokenProvider.validateToken(token)) {
                String identifier = jwtTokenProvider.getSubjectFromToken(token);

                User user = userRepository.findByEmailIgnoreCaseOrUsernameIgnoreCase(identifier.trim(), identifier.trim())
                        .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

                Map<String, String> response = new HashMap<>();
                response.put("username", user.getUsername());
                response.put("email", user.getEmail());

                return response;
            }
            else {
                throw new NotAllowedException("Ocorreu um erro ao validar o token");
            }
        }
        catch (Exception e) {
            if (e instanceof NotAllowedException notAllowedException) {
                throw notAllowedException;
            }

            String causeMessage = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
            throw new NotAllowedException("Ocorreu um erro ao validar o token: " + causeMessage);
        }
    }
}
