package com.hichat.hichat.service;

import com.hichat.hichat.dto.GradeResultDate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GradeResultService {

    public List<GradeResultDate> getDates() {
        return List.of(
                new GradeResultDate("2025-1학기", "학기성적", "6월 30일", "오전 10시"),
                new GradeResultDate("2025-2학기", "학기성적", "12월 29일", "오전 10시")

        );
    }
}
