package com.hichat.hichat;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * @SpringBootApplication 어노테이션으로 Spring Boot의 자동 설정, 컴포넌트 스캔등
 * 핵심 기능이 모두 활성화됨
 * 이 클래스가 프로젝트의 시작점!
 */
@SpringBootApplication
public class HichatApplication {
    /**
     * Java 애플리케이션의 main 메서드 부분
     * SpringApplication.run()을 호출하여 "내장된 Tomcat" 서버를 실행하고
     * Spring 애플리케이션 시작
     * @param args
     */
	public static void main(String[] args) {
		SpringApplication.run(HichatApplication.class, args);
	}

}
