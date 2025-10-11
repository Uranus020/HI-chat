package com.hichat.hichat.service;

import com.hichat.hichat.dto.ExamInfo;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class ExamService {
    private final Map<String, Map<String, Map<String, Map<String, Map<String, ExamInfo>>>>> examData = new HashMap<>();

    public ExamService() {
        ExamInfo info = new ExamInfo("11월 20일", "10:00", "C101", "1분반: C11111 / 2분반: C23455");
        examData
            .computeIfAbsent("2025-2학기", x -> new HashMap<>())
            .computeIfAbsent("2학년", x -> new HashMap<>())
            .computeIfAbsent("데이터통신", x -> new HashMap<>())
            .put("홍길동", Map.of("공통", info));
    }

    public List<String> getGrades(String semester) {
        return new ArrayList<>(examData.getOrDefault(semester, Map.of()).keySet());
    }

    public List<String> getSubjects(String semester, String grade) {
        return new ArrayList<>(examData.getOrDefault(semester, Map.of()).getOrDefault(grade, Map.of()).keySet());
    }

    public List<String> getProfessors(String semester, String grade, String subject) {
        return new ArrayList<>(examData.getOrDefault(semester, Map.of()).getOrDefault(grade, Map.of()).getOrDefault(subject, Map.of()).keySet());
    }

    public Map<String, ExamInfo> getExamInfo(String semester, String grade, String subject, String professor) {
        return examData.getOrDefault(semester, Map.of())
                       .getOrDefault(grade, Map.of())
                       .getOrDefault(subject, Map.of())
                       .getOrDefault(professor, Map.of());
    }
}
