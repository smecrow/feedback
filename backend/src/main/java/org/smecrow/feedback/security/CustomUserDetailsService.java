package org.smecrow.feedback.security;

import org.smecrow.feedback.model.User;
import org.smecrow.feedback.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

@Service
public class CustomUserDetailsService implements UserDetailsService {
    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        String normalizedIdentifier = identifier == null ? "" : identifier.trim();

        User user = userRepository.findByEmailIgnoreCaseOrUsernameIgnoreCase(normalizedIdentifier, normalizedIdentifier)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + identifier));

        String principal = (user.getEmail() != null && !user.getEmail().isBlank())
                ? user.getEmail()
                : user.getUsername();

        return new org.springframework.security.core.userdetails.User(
                principal,
                user.getPassword(),
                new ArrayList<>()
        );
    }
}
