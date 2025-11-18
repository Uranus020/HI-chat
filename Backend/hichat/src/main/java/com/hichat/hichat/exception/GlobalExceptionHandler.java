package com.hichat.hichat.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import java.util.*;

/**
 * @RestControllerAdvice
 * 모든 @RestController에서 발생하는 예외를 이 클래스가 가로채서 처리하도록!
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * @ExceptionHandler(MethodArgumentNotValidException.class)
     * 컨트롤러에서 @Valid 유효성 검사에 실패했을 때(예: GPARequest)
     * 발생하는 예외를 전문적으로 처리하기
     * @ResponseStatus(HttpStatus.BAD_REQUEST): HTTP 400 (잘못된 요청) 코드를 반환함
     */
  @ExceptionHandler(MethodArgumentNotValidException.class)
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  public Map<String, Object> handleValidation(MethodArgumentNotValidException ex) {
      // 오류 정보를 가공하여 프론트엔드가 알아보기 쉬운 Map(JSON) 형태로 반환
    return Map.of(
      "message","Invalid request",
      "errors", ex.getBindingResult().getFieldErrors().stream()
        .map(e -> Map.of("field", e.getField(), "error", e.getDefaultMessage()))
        .toList()
    );
  }

    /**
     * @ExceptionHandler(Exception.class)
     * 위에서 잡지 못한 모든 종류의 예외(예: 서버 내부 오류)를 처리
     * @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR): HTTP 500 (서버 오류) 코드를 반환
     */
  @ExceptionHandler(Exception.class)
  @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
  public Map<String, Object> handleAny(Exception ex) {
      // 실제 오류 메시지를 "detail"에 담아 반환
    return Map.of("message","Server error","detail", ex.getMessage());
  }
}
