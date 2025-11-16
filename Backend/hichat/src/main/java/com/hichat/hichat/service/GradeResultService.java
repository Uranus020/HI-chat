package com.hichat.hichat.service;

import com.hichat.hichat.dto.GradeResultDate;
import org.springframework.stereotype.Service;

import java.util.Arrays; // 1. Arrays를 import 합니다.
import java.util.List;

@Service
public class GradeResultService {

    public List<GradeResultDate> getDates() {
        // 2. List.of() 대신 Arrays.asList() 를 사용합니다.
        return Arrays.asList(
                new GradeResultDate("2025-1학기", "학기성적", "6월 30일", "오전 10시"),
                new GradeResultDate("2025-2학기", "학기성적", "12월 29일", "오전 10시")
        );
    }
}