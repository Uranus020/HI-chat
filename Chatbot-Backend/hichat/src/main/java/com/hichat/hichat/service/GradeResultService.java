package com.hichat.hichat.service;

import com.hichat.hichat.dto.GradeResultDate;
import org.springframework.stereotype.Service;

@Service
public class GradeResultService {

    private final GradeResultDate resultDate;

    public GradeResultService() {
        resultDate = new GradeResultDate();
        resultDate.setSemester("2025-2학기");
        resultDate.setDate("12월 26일");
        resultDate.setTime("오전 10시");
    }

    public GradeResultDate getDate() {
        return resultDate;
    }
}
