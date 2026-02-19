package org.smecrow.feedback.service;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.smecrow.feedback.dto.OsMarkDoneRequest;
import org.smecrow.feedback.dto.OsRequest;
import org.smecrow.feedback.dto.OsResponse;
import org.smecrow.feedback.exceptions.NotAllowedException;
import org.smecrow.feedback.exceptions.NotFoundException;
import org.smecrow.feedback.model.Os;
import org.smecrow.feedback.model.Reason;
import org.smecrow.feedback.model.User;
import org.smecrow.feedback.repository.OsRepository;
import org.smecrow.feedback.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.Month;
import java.time.temporal.TemporalAdjusters;
import java.util.Optional;

@Slf4j
@Service
@AllArgsConstructor
public class OsService {

    private final OsRepository osRepository;
    private final UserRepository userRepository;

    public OsResponse createOs(@Valid OsRequest request, Authentication authentication) {
        log.info("Criando nova OS.");
        log.info("Criando nova OS.");
        // Format client name to Title Case
        String formattedClient = formatClientName(request.client());
        Os osEntity = request.toEntity();
        osEntity.setClient(formattedClient);

        log.info("Extraindo o usuário logado.");
        log.info("Extraindo o usuário logado.");
        Object principal = authentication.getPrincipal();

        String userEmail;
        if (principal instanceof UserDetails) {
            userEmail = ((UserDetails) principal).getUsername();
        } else {
             userEmail = principal.toString();
        }

        User managedUser = userRepository.findByEmail(userEmail).orElseThrow(() -> new NotFoundException("Usuário com o email: " + userEmail + " não encontrado."));
        log.info("Usuário logado extraído com sucesso.");
        log.info("Usuário logado extraído com sucesso.");

        osEntity.setUser(managedUser);

        log.info("Salvando nova OS no banco de dados.");
        Os savedOs = osRepository.save(osEntity);
        return OsResponse.fromEntity(savedOs);
    }

    public OsResponse importOs(org.smecrow.feedback.dto.OsImportRequest request, Authentication authentication) {
        log.info("Importando OS via CSV.");
        String formattedClient = formatClientName(request.client());
        Os osEntity = request.toEntity();
        osEntity.setClient(formattedClient);

        User managedUser = getLoggedUser(); // Reuse existing helper
        osEntity.setUser(managedUser);

        Os savedOs = osRepository.save(osEntity);
        return OsResponse.fromEntity(savedOs);
    }

    public Page<OsResponse> getAllOs(Pageable pageable) {
        log.info("Buscando todas as OS do usuário logado.");
        User user = getLoggedUser();
        Page<Os> osPage = osRepository.findByUser(user, pageable);
        log.info("As OS foram encontradas.");
        return osPage.map(OsResponse::fromEntity);
    }

    public Page<OsResponse> getByClient(Pageable pageable, String client) {
        log.info("Buscando OS pelo cliente: {}.", client);
        User user = getLoggedUser();
        Page<Os> osPage = osRepository.findByUserAndClientContainingIgnoreCase(user, client, pageable);
        log.info("Foram encontradas no total de {} OS pelo cliente informado.", osPage.getTotalElements());
        return osPage.map(OsResponse::fromEntity);
    }

    public Page<OsResponse> getByDone(Pageable pageable, Boolean done) {
        log.info("Procurando OS com status done={}.", done);
        User user = getLoggedUser();
        Page<Os> osPage = osRepository.findByUserAndDone(user, done, pageable);
        log.info("Foram encontradas {} OS com status done={}.", osPage.getTotalElements(), done);
        return osPage.map(OsResponse::fromEntity);
    }

    public Page<OsResponse> getPerMonth(int monthNumber, int year, Pageable pageable){
        if (monthNumber < 1 || monthNumber > 12) throw new IllegalArgumentException("Mês deve estar entre 1 e 12. Recebido: " + monthNumber);

        Month month = Month.of(monthNumber);

        LocalDateTime dateAfter = LocalDateTime.of(year, month, 1, 0, 0);
        LocalDateTime dateBefore = dateAfter.with(TemporalAdjusters.lastDayOfMonth()).withHour(23).withMinute(59).withSecond(59);

        log.info("Procurando OS que foram feitas no mês: {} de {}.", month.name(), year);
        User user = getLoggedUser();
        Page<Os> osPage = osRepository.findByUserAndCreatedAtBetween(user, dateAfter, dateBefore, pageable);

        log.info("Foram encontradas no total: {} OS.", osPage.getTotalElements());
        return osPage.map(OsResponse::fromEntity);
    }

    public Page<OsResponse> getByReason(Pageable pageable, String reason) {
        if (reason == null || reason.isBlank()) throw new IllegalArgumentException("Motivo não pode ser vazio");

        log.info("Buscando por motivo: {}.", reason);
        Reason reasonEnum = stringToReasonConverter(reason);

        if (reasonEnum == null) throw new IllegalArgumentException("Motivo inválido: " + reason);

        log.info("Procurando no banco de dados pelo motivo: {}.", reasonEnum);
        User user = getLoggedUser();
        Page<Os> osPage = osRepository.findByUserAndReason(user, reasonEnum, pageable);
        log.info("Encontrado no total {} de OS pelo motivo {}.", osPage.getTotalElements(), reasonEnum);
        return osPage.map(OsResponse::fromEntity);
    }

    public OsResponse markDone(Long id, OsMarkDoneRequest done) {
        Os os = osRepository.findById(id).orElseThrow(() -> new NotFoundException("OS com o ID: " + id + " não encontrada"));

        boolean newState = done.done();

        if (newState != os.getDone()) {
            log.info("Alterando o estado da OS de {} para: {}.", os.getDone(), newState);
            os.setDone(newState);
        }
        else {
            log.info("Estado da OS já é {}, nenhuma alteração necessária", newState);
        }

        log.info("Salvando a OS atualizada no banco de dados.");
        return OsResponse.fromEntity(osRepository.save(os));
    }

    public void deleteOs(Long id, Authentication authentication) {

        if (!authenticated(id, authentication)) {
            log.error("Você não tem permissão para deletar essa OS. Apenas o usuário que a criou que é permitido.");
            throw new NotAllowedException("Você não tem permissão para deletar essa OS. Apenas o usuário que a criou que é permitido.");
        }

        log.info("Deletando a OS com o ID: {}.", id);
        osRepository.deleteById(id);
    }

    public OsResponse updateOs(Long id, OsRequest request, Authentication authentication) {
        if (!authenticated(id, authentication)) {
            log.error("Permissão negada para editar OS: {}", id);
            throw new NotAllowedException("Você não tem permissão para editar esta OS.");
        }

        Os os = osRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("OS não encontrada com ID: " + id));

        log.info("Atualizando OS {}: Cliente '{}' -> '{}', Motivo '{}' -> '{}'.",
                id, os.getClient(), request.client(), os.getReason(), request.reason());

        String formattedClient = formatClientName(request.client());
        os.setClient(formattedClient);
        os.setReason(request.reason());

        return OsResponse.fromEntity(osRepository.save(os));
    }

    public boolean authenticated(Long id, Authentication authentication) {
        Optional<Os> os = osRepository.findById(id);

        if (os.isEmpty()) return false;

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String authenticatedEmail = userDetails.getUsername();

        return authenticatedEmail.equals(os.get().getUser().getEmail());
    }

    public Reason stringToReasonConverter(String reason) {
        if (reason == null || reason.isBlank()) return null;

        log.info("Convertendo o motivo: {} para o ENUM Reason.", reason);

        try {
            return Reason.valueOf(reason.trim().toUpperCase().replace(" ", "_"));
        }
        catch (IllegalArgumentException e) {
            System.out.println("Nenhum valor do ENUM Reason encontrado para: " + reason + ".");
            return null;
        }
    }
    private String formatClientName(String client) {
        if (client == null || client.isBlank()) return client;
        return java.util.stream.Stream.of(client.trim().split("\\s+"))
                .map(word -> word.substring(0, 1).toUpperCase() + word.substring(1).toLowerCase())
                .collect(java.util.stream.Collectors.joining(" "));
    }

    private User getLoggedUser() {
        Authentication authentication = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        Object principal = authentication.getPrincipal();

        String userEmail;
        if (principal instanceof UserDetails) {
            userEmail = ((UserDetails) principal).getUsername();
        } else {
            userEmail = principal.toString();
        }

        return userRepository.findByEmail(userEmail).orElseThrow(() -> new NotFoundException("Usuário logado não encontrado no banco."));
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteAllOs() {
        User user = getLoggedUser();
        log.info("Deletando todas as OS do usuário: {}", user.getEmail());
        osRepository.deleteByUser(user);
    }
}
