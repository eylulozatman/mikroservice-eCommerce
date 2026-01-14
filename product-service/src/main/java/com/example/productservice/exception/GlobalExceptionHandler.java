package com.example.productservice.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(NotFoundException.class)
  public ResponseEntity<ApiError> handleNotFound(NotFoundException ex, HttpServletRequest req) {
    ApiError err = new ApiError(Instant.now(), 404, "Not Found", ex.getMessage(), req.getRequestURI(), null);
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
  }

  @ExceptionHandler(ForbiddenException.class)
  public ResponseEntity<ApiError> handleForbidden(ForbiddenException ex, HttpServletRequest req) {
    ApiError err = new ApiError(Instant.now(), 403, "Forbidden", ex.getMessage(), req.getRequestURI(), null);
    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(err);
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
    Map<String, String> fieldErrors = new HashMap<>();
    for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
      fieldErrors.put(fe.getField(), fe.getDefaultMessage());
    }
    ApiError err = new ApiError(Instant.now(), 400, "Bad Request", "Validation failed", req.getRequestURI(), fieldErrors);
    return ResponseEntity.badRequest().body(err);
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiError> handleGeneric(Exception ex, HttpServletRequest req) {
    // Log the actual exception for debugging
    ex.printStackTrace();
    ApiError err = new ApiError(Instant.now(), 500, "Internal Server Error", "Unexpected error occurred: " + ex.getMessage(), req.getRequestURI(), null);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
  }
}

