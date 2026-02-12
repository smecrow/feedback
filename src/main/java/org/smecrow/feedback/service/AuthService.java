package org.smecrow.feedback.service;

import lombok.extern.slf4j.Slf4j;
import org.smecrow.feedback.dto.AuthResponse;
import org.smecrow.feedback.dto.LoginRequest;
import org.smecrow.feedback.dto.RegisterRequest;
import org.smecrow.feedback.exceptions.AlreadyExistsException;
import org.smecrow.feedback.exceptions.NotAllowedException;
import org.smecrow.feedback.model.User;
import org.smecrow.feedback.repository.UserRepository;
import org.smecrow.feedback.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@Service
public class AuthService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailOrUsername(request.login(), request.login()).orElseThrow(() -> new BadCredentialsException("Email ou senha inválidos."));

        log.info("Usuário: {} encontrado.", user.getUsername());

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new BadCredentialsException("Email ou senha inválidos");
        }

        log.info("Senha correta. Gerando token JWT.");

        String token = jwtTokenProvider.generateToken(user);

        log.info("Token gerado com sucesso. Retornando resposta.");
        return new AuthResponse(token, user.getUsername(), user.getEmail());
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new AlreadyExistsException("Email já cadastrado");
        }

        if (userRepository.existsByUsername(request.username())) {
            throw new AlreadyExistsException("Nome de usuário já cadastrado");
        }

        User user = new User();
        user.setUsername(request.username());
        log.info("Usuário: {}.", user.getUsername());
        user.setEmail(request.email());
        log.info("Email: {}.", user.getEmail());
        user.setPassword(passwordEncoder.encode(request.password()));
        log.info("Senha criptografada.");
        user.setCreatedAt(LocalDateTime.now());
        log.info("Hora atual: {}.", LocalDateTime.now());

        userRepository.save(user);

        String token = jwtTokenProvider.generateToken(user);

        log.info("Token gerado com sucesso. Retornando resposta.");
        return new AuthResponse(token, user.getUsername(), user.getEmail());
    }

    public Map<String, String> validateToken(String authHeader) {
        try {
            // Remover o "Bearer" do token
            String token = authHeader.substring(7);

            // Validar o token
            if (jwtTokenProvider.validateToken(token)) {
                // Extrai informações do token
                String email = jwtTokenProvider.getEmailFromToken(token);

                // Busca o usuário no banco
                User user = userRepository.findByEmail(email)
                        .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

                // Retorna as informações
                Map<String, String> response = Map.of("username", user.getUsername(), "email", user.getEmail());

                return response;
            }
            else {
                throw new NotAllowedException("Ocorreu um erro ao validar o token");
            }
        }
        catch (Exception e) {
            throw new NotAllowedException("Ocorreu um erro ao validar o token");
        }
    }
}
