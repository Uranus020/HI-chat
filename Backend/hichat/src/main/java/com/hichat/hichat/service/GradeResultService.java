package com.hichat.hichat.service;

import com.hichat.hichat.dto.GradeResultDate;
import org.springframework.stereotype.Service;

import java.util.Arrays; // 1. Arrays를 import 합니다.
import java.util.List;

/**
 * @Service
 * 이 클래스가 서비스 컴포넌트임을 선언
 */
@Service
public class GradeResultService {

    /**
     * 하드코딩된 성적 확인 일정 리스트를 반환
     * @return List<GradeResultDate> 성적 일정 DTO가 담긴 리스트
     */
    public List<GradeResultDate> getDates() {
        // 2. List.of() 대신 Arrays.asList() 를 사용!!!
        // -> java9+ 기능이 아니면 오류나기 때문에 java8에서도 돌아가도록하기
        return Arrays.asList(
                new GradeResultDate("2025-1학기", "학기성적", "6월 30일", "오전 10시"),
                new GradeResultDate("2025-2학기", "학기성적", "12월 29일", "오전 10시")
        );
    }
}