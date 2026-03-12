package org.smecrow.feedback.exceptions;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    private ResponseEntity<ErrorResponse> buildResponse(HttpStatus status, String message, Exception e, HttpServletRequest request) {
        String details = extractDetails(e);
        String path = request != null ? request.getRequestURI() : null;

        log.error("Request failed [{} {}]: {} | details={}",
                request != null ? request.getMethod() : "N/A",
                path,
                message,
                details,
                e);

        ErrorResponse error = new ErrorResponse(
                message,
                status.value(),
                status.getReasonPhrase(),
                path,
                details
        );

        return new ResponseEntity<>(error, status);
    }

    private String extractDetails(Throwable throwable) {
        if (throwable == null) {
            return null;
        }

        Throwable rootCause = throwable;
        while (rootCause.getCause() != null && rootCause.getCause() != rootCause) {
            rootCause = rootCause.getCause();
        }

        String rootMessage = rootCause.getMessage();
        if (rootMessage == null || rootMessage.isBlank()) {
            return rootCause.getClass().getSimpleName();
        }

        return rootCause.getClass().getSimpleName() + ": " + rootMessage;
    }

    @ExceptionHandler(NotAllowedException.class)
    public ResponseEntity<ErrorResponse> handleNotAllowedException(NotAllowedException e, HttpServletRequest request) {
        return buildResponse(HttpStatus.FORBIDDEN, e.getMessage(), e, request);
    }

    @ExceptionHandler(InternalAuthenticationServiceException.class)
    public ResponseEntity<ErrorResponse> handleInternalAuthException(InternalAuthenticationServiceException e, HttpServletRequest request) {
        Throwable cause = e.getCause();
        String message = (cause != null && cause.getMessage() != null) ? cause.getMessage() : e.getMessage();
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, message, e, request);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgumentException(IllegalArgumentException e, HttpServletRequest request) {
        String message = e.getMessage() != null ? e.getMessage() : "Invalid request";
        return buildResponse(HttpStatus.BAD_REQUEST, message, e, request);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalStateException(IllegalStateException e, HttpServletRequest request) {
        String message = e.getMessage() != null ? e.getMessage() : "Estado interno inválido";
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, message, e, request);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentialsException(BadCredentialsException e, HttpServletRequest request) {
        String message = (e.getMessage() != null) ? e.getMessage() : "Credenciais inválidas";
        return buildResponse(HttpStatus.UNAUTHORIZED, message, e, request);
    }

    @ExceptionHandler(AlreadyExistsException.class)
    public ResponseEntity<ErrorResponse> handleAlreadyExistsException(AlreadyExistsException e, HttpServletRequest request) {
        String message = e.getCause() != null ? e.getCause().getMessage() : e.getMessage();
        return buildResponse(HttpStatus.CONFLICT, message, e, request);
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFoundException(NotFoundException e, HttpServletRequest request) {
        String message = e.getCause() != null ? e.getCause().getMessage() : e.getMessage();
        return buildResponse(HttpStatus.NOT_FOUND, message, e, request);
    }

    @ExceptionHandler(GenericExeption.class)
    public ResponseEntity<ErrorResponse> handleGenericException(GenericExeption e, HttpServletRequest request) {
        String message = e.getCause() != null ? e.getCause().getMessage() : e.getMessage();
        return buildResponse(HttpStatus.NOT_ACCEPTABLE, message, e, request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValidException(MethodArgumentNotValidException e, HttpServletRequest request) {
        String message = e.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(fieldError -> fieldError.getField() + ": " + fieldError.getDefaultMessage())
                .collect(Collectors.joining(", "));

        if (message.isBlank()) {
            message = "Dados da requisição inválidos.";
        }

        return buildResponse(HttpStatus.BAD_REQUEST, message, e, request);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleHttpMessageNotReadableException(HttpMessageNotReadableException e, HttpServletRequest request) {
        return buildResponse(HttpStatus.BAD_REQUEST, "Corpo da requisição inválido ou malformado.", e, request);
    }

    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<ErrorResponse> handleMissingRequestHeaderException(MissingRequestHeaderException e, HttpServletRequest request) {
        String message = "Cabeçalho obrigatório ausente: " + e.getHeaderName();
        return buildResponse(HttpStatus.BAD_REQUEST, message, e, request);
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<ErrorResponse> handleDataAccessException(DataAccessException e, HttpServletRequest request) {
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Erro ao acessar o banco de dados.", e, request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(Exception e, HttpServletRequest request) {
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Erro interno inesperado.", e, request);
    }
}
