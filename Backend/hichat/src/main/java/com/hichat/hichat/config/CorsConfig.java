package com.hichat.hichat.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * @Configuration
 * 이 클래스가 Spring의 '설정'파일
 * 앱이 시작될 때 이 파일의 설정이 로드됨
 */
@Configuration
public class CorsConfig {
    /**
     * @Bean
     * 이 메서드가 반환하는 객체인 (WebMvcConfigurer)를 Spring이 관리하도록 등록함
     */
  @Bean
  public WebMvcConfigurer corsConfigurer() {
      // WebMvcConfigurer 인터페이스를 익명 클래스로 구현하여 CORS 설정을 추가함
    return new WebMvcConfigurer() {
        /**
         * addCorsMappings 메서드를 override/재정의 하여
         * CORS 정책을 자세히 설정
         * @param registry
         */
      @Override
      public void addCorsMappings(@NonNull CorsRegistry registry) {
          // "/api/**"로 시작하는 모든 경로에 대해
        registry.addMapping("/api/**")

                // "http://localhost:5173"(Vite)와 "http://localhost:3000"(React)의
                // 프론트엔드 주소들의 요청을 허용함
                .allowedOrigins(
                        "http://localhost:5173",
                        "http://localhost:3000"

                )
                // "GET/POST/OPTIONS 의 HTTP 메서드를 허용
                .allowedMethods("GET", "POST", "OPTIONS")
                // 모든 HTTP 헤더를 허용
                .allowedHeaders("*");
        // .allowCredentials(true); // 프론트와 세션/쿠키 쓸 때엔 주석 해제하기
      }
    };
  }
}