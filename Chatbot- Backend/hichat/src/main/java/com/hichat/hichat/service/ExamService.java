package com.hichat.hichat.service;
import javax.annotation.PostConstruct;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hichat.hichat.dto.ExamInfo;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;


import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ExamService {

    // 1. 데이터를 담을 Map을 final로 선언 (기존과 동일)
    private final Map<String, Map<String, Map<String, Map<String, Map<String, ExamInfo>>>>> examData;

    private final ResourceLoader resourceLoader;
    private final ObjectMapper objectMapper;

    // 2. 생성자에서 ObjectMapper와 ResourceLoader를 주입받고 examData 맵을 초기화
    public ExamService(ResourceLoader resourceLoader, ObjectMapper objectMapper) {
        this.resourceLoader = resourceLoader;
        this.objectMapper = objectMapper;
        this.examData = new HashMap<>(); // 비어있는 맵으로 초기화
    }

    // 3. 서버 시작 시(@PostConstruct) JSON 파일을 읽어 맵에 데이터를 채우는 로직
    @PostConstruct
    public void loadExamData() {
        try {
            // "classpath:exam-data.json"은 'src/main/resources/exam-data.json'을 의미
            Resource resource = resourceLoader.getResource("classpath:exam-data.json");
            InputStream inputStream = resource.getInputStream();

            // JSON 파일을 읽어서 우리가 정의한 복잡한 Map<String, ...> 구조로 한번에 변환
            TypeReference<HashMap<String, Map<String, Map<String, Map<String, Map<String, ExamInfo>>>>>> typeRef
                    = new TypeReference<>() {};

            // 파일에서 읽어온 데이터를 examData 맵에 복사
            Map<String, Map<String, Map<String, Map<String, Map<String, ExamInfo>>>>> loadedData = objectMapper.readValue(inputStream, typeRef);
            this.examData.putAll(loadedData);

            System.out.println("exam-data.json 파일을 성공적으로 로드했습니다.");

        } catch (Exception e) {
            e.printStackTrace();
            // 파일 로딩에 실패하면 서버가 시작되지 않도록 예외를 던지는 것이 좋습니다.
            throw new RuntimeException("exam-data.json 파일 로드에 실패했습니다.", e);
        }
    }

    // 4. 이 아래의 Service 로직(getGrades, getSubjects 등)은
    //    기존 코드와 100% 동일하며 수정할 필요가 없습니다.
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