package org.smecrow.feedback.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.Collections;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.smecrow.feedback.dto.OsMarkDoneRequest;
import org.smecrow.feedback.dto.OsRequest;
import org.smecrow.feedback.dto.OsResponse;
import org.smecrow.feedback.model.Reason;
import org.smecrow.feedback.security.JwtTokenProvider;
import org.smecrow.feedback.service.OsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.mockito.*;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(OsController.class)
@Import(com.fasterxml.jackson.databind.ObjectMapper.class) // Tenta forçar o carregamento
class OsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private OsService osService;

    // Mocks de segurança
    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private UserDetailsService userDetailsService;

    @MockitoBean
    private Reason reason;

    @Test
    @WithMockUser(username = "suporte@smecrow.org")
    @DisplayName("Deve criar uma OS com sucesso")
    void createOsSuccess() throws Exception {
        // Arrange
        OsRequest request = new OsRequest("Cliente Teste", reason);
        OsResponse response = new OsResponse(1L, "Cliente Teste", reason.valueOf("LENTIDAO"), LocalDateTime.now(), false, null);

        given(osService.createOs(any(OsRequest.class), any())).willReturn(response);

        // Act & Assert
        mockMvc.perform(post("/api/os/createOs")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk()) // ou isCreated() dependendo da sua implementação
                .andExpect(jsonPath("$.client").value("Cliente Teste"))
                .andExpect(jsonPath("$.reason").value("LENTIDAO"));
    }

    @Test
    @WithMockUser
    @DisplayName("Deve listar todas as OS paginadas")
    void getAllOsSuccess() throws Exception {
        // Arrange
        OsResponse osResponse = new OsResponse(1L, "Cliente A", reason, LocalDateTime.now(), false, null);
        Page<OsResponse> page = new PageImpl<>(Collections.singletonList(osResponse));

        given(osService.getAllOs(any(Pageable.class))).willReturn(page);

        // Act & Assert
        mockMvc.perform(get("/api/os/getAllOs")
                .param("page", "0")
                .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].client").value("Cliente A"));
    }

    @Test
    @WithMockUser
    @DisplayName("Deve marcar OS como concluída")
    void markDoneSuccess() throws Exception {
        // Arrange
        Long osId = 1L;
        OsMarkDoneRequest request = new OsMarkDoneRequest(true);
        OsResponse response = new OsResponse(osId, "Cliente A", reason, LocalDateTime.now(), true, null);

        given(osService.markDone(eq(osId), any(OsMarkDoneRequest.class))).willReturn(response);

        // Act & Assert
        mockMvc.perform(put("/api/os/done/{id}", osId)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.done").value(true));
    }

    @Test
    @WithMockUser
    @DisplayName("Deve deletar OS com sucesso")
    void deleteOsSuccess() throws Exception {
        // Act & Assert
        mockMvc.perform(delete("/api/os/delete/{id}", 1L)
                .with(csrf()))
                .andExpect(status().isNoContent());
    }
}