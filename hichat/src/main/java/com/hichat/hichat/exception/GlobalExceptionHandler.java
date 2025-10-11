package com.hichat.hichat.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestControllerAdvice
public class GlobalExceptionHandler {
  @ExceptionHandler(MethodArgumentNotValidException.class)
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  public Map<String, Object> handleValidation(MethodArgumentNotValidException ex) {
    return Map.of(
      "message","Invalid request",
      "errors", ex.getBindingResult().getFieldErrors().stream()
        .map(e -> Map.of("field", e.getField(), "error", e.getDefaultMessage()))
        .toList()
    );
  }

  @ExceptionHandler(Exception.class)
  @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
  public Map<String, Object> handleAny(Exception ex) {
    return Map.of("message","Server error","detail", ex.getMessage());
  }
}
