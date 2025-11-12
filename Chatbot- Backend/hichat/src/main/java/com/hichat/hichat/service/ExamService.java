package com.hichat.hichat.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hichat.hichat.dto.ExamInfo;
import org.springframework.context.ApplicationContext;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Service;


import javax.annotation.PostConstruct;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ExamService {

    // 데이터를 담을 Map을 final로 선언
    private final Map<String, Map<String, Map<String, Map<String, Map<String, ExamInfo>>>>> examData = new HashMap<>();
    private final ApplicationContext ctx;
    private final ObjectMapper objectMapper;

    public ExamService(ApplicationContext ctx, ObjectMapper objectMapper) {
        this.ctx = ctx;
        this.objectMapper = objectMapper;
    }

    private static final TypeReference<
            Map<String, Map<String, Map<String, Map<String, Map<String, ExamInfo>>>>>>
            TYPE_REF = new TypeReference<>() {};
    // 서버 시작 시(@PostConstruct) JSON 파일을 읽어 맵에 데이터를 채우는 로직
    @PostConstruct
    public void loadExamData() {
        try {
            var resolver = new PathMatchingResourcePatternResolver();
            Resource[] resources = resolver.getResources("classpath*:examdata/*.json");

            var typeRef = new TypeReference<
                    Map<String, Map<String, Map<String, Map<String, Map<String, ExamInfo>>>>>>() {};

            for (Resource r : resources) {
                try (InputStream is = r.getInputStream()) {
                    var loaded = objectMapper.readValue(is, typeRef);
                    examData.putAll(loaded);         // 파일끼리 키가 겹치면 deepMerge로 교체
                }
            }
        } catch (Exception e) {
            throw new IllegalStateException("시험 데이터 JSON 파일 로드 실패", e);
        }
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