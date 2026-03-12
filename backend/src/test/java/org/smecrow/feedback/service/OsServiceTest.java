package org.smecrow.feedback.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.smecrow.feedback.dto.OsRequest;
import org.smecrow.feedback.dto.OsResponse;
import org.smecrow.feedback.dto.OsUpdateStatusRequest;
import org.smecrow.feedback.exceptions.NotAllowedException;
import org.smecrow.feedback.model.Os;
import org.smecrow.feedback.model.OsStatus;
import org.smecrow.feedback.model.Reason;
import org.smecrow.feedback.repository.OsRepository;
import org.smecrow.feedback.repository.UserRepository;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.User;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OsServiceTest {

    @Mock
    private OsRepository osRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private OsService osService;

    @Test
    void shouldUpdateStatusWhenAuthenticatedUserOwnsTheOs() {
        Os os = buildOs(10L, "owner@email.com", OsStatus.PENDENTE);
        Authentication authentication = authenticationFor("owner@email.com");

        when(osRepository.findById(10L)).thenReturn(Optional.of(os));
        when(osRepository.save(os)).thenReturn(os);

        OsResponse response = osService.updateStatus(
                10L,
                new OsUpdateStatusRequest(OsStatus.FEEDBACK_CONCLUIDO),
                authentication
        );

        assertEquals(OsStatus.FEEDBACK_CONCLUIDO, os.getStatus());
        assertEquals(OsStatus.FEEDBACK_CONCLUIDO, response.status());
        verify(osRepository).save(os);
    }

    @Test
    void shouldRejectStatusUpdateWhenUserDoesNotOwnTheOs() {
        Os os = buildOs(10L, "owner@email.com", OsStatus.PENDENTE);
        Authentication authentication = authenticationFor("other@email.com");

        when(osRepository.findById(10L)).thenReturn(Optional.of(os));

        NotAllowedException exception = assertThrows(
                NotAllowedException.class,
                () -> osService.updateStatus(10L, new OsUpdateStatusRequest(OsStatus.OS_REALIZADA), authentication)
        );

        assertEquals("Você não tem permissão para alterar o status desta OS.", exception.getMessage());
        verify(osRepository, never()).save(os);
    }

    @Test
    void shouldRejectDeleteWhenUserDoesNotOwnTheOs() {
        Os os = buildOs(10L, "owner@email.com", OsStatus.PENDENTE);
        Authentication authentication = authenticationFor("other@email.com");

        when(osRepository.findById(10L)).thenReturn(Optional.of(os));

        assertThrows(NotAllowedException.class, () -> osService.deleteOs(10L, authentication));

        verify(osRepository, never()).deleteById(10L);
    }

    @Test
    void shouldRejectUpdateWhenUserDoesNotOwnTheOs() {
        Os os = buildOs(10L, "owner@email.com", OsStatus.PENDENTE);
        Authentication authentication = authenticationFor("other@email.com");

        when(osRepository.findById(10L)).thenReturn(Optional.of(os));

        assertThrows(
                NotAllowedException.class,
                () -> osService.updateOs(10L, new OsRequest("cliente teste", Reason.UPGRADE), authentication)
        );

        verify(osRepository, never()).save(os);
    }

    private Authentication authenticationFor(String email) {
        User principal = new User(email, "senha", java.util.Collections.emptyList());
        return new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
    }

    private Os buildOs(Long id, String ownerEmail, OsStatus status) {
        org.smecrow.feedback.model.User owner = new org.smecrow.feedback.model.User();
        owner.setId(1L);
        owner.setEmail(ownerEmail);
        owner.setUsername("owner");
        owner.setPassword("encoded");

        Os os = new Os();
        os.setId(id);
        os.setClient("Cliente");
        os.setReason(Reason.UPGRADE);
        os.setCreatedAt(LocalDateTime.now());
        os.setStatus(status);
        os.setUser(owner);
        return os;
    }
}
