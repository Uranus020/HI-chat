package com.hichat.hichat.service;

import com.hichat.hichat.domain.ExamSchedule;
import com.hichat.hichat.dto.ExamInfo;
import com.hichat.hichat.repository.ExamScheduleRepository;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap; // (순서를 보장하는 Map)
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors; // (Stream API를 사용하기 위함)

/**
 * @Service
 * 이 클래스가 비즈니스 로직을 담당하는 서비스 레이어의 컴포넌트임을 선언
 * Spring이 이 클래스를 Bean으로 등록
 */
@Service
public class ExamService {

    // (final) 리포지토리 객체 (의존성 주입)
    private final ExamScheduleRepository examScheduleRepository;

    /**
     * 생성자 기반 의존성 주입 (Dependency Injection)
     * Spring이 실행될 때, `ExamScheduleRepository`의 구현체(Bean)를
     * 자동으로 찾아서 이 생성자를 통해 주입(연결)해줌
     */
    public ExamService(ExamScheduleRepository examScheduleRepository) {
        this.examScheduleRepository = examScheduleRepository;
    }

    // ---------------------------
    //  공통: "2025-1학기 중간고사" 파싱
    // ---------------------------
    private static class TermKey {
        String year;
        String semester;  // "1학기", "2학기"
        String examType;  // "중간고사", "기말고사"
    }

    /**
     * 헬퍼(Helper) 메서드:
     * 프론트엔드에서 받은 "2025-1학기 중간고사" 형식의 문자열(semesterKey)을
     * DB에서 검색할 수 있도록 "2025", "1학기", "중간고사" 3조각으로 분해(파싱)해줌
     * @param :semesterKey 컨트롤러에서 받은 원본 문자열
     * @return :TermKey 객체 (year, semester, examType 포함)
     * @throws :IllegalArgumentException 형식이 잘못된 경우 예외 발생
     */
    private TermKey parseSemesterKey(String semesterKey) {
        if (semesterKey == null || semesterKey.isBlank()) {
            throw new IllegalArgumentException("semester 값이 비어 있습니다.");
        }

        // 1. 공백을 기준으로 분리: "2025-1학기 중간고사" 기준으로 공백으로 나눔 -> ["2025-1학기", "중간고사"]
        String[] parts = semesterKey.trim().split("\\s+"); // ["2025-1학기", "중간고사"]
        if (parts.length < 2) {
            throw new IllegalArgumentException("semester 형식이 올바르지 않습니다: " + semesterKey);
        }

        String yearSemester = parts[0];        // "2025-1학기"
        String examType = parts[1];            // "중간고사" 또는 "기말고사"

        //2. "-"를 기준으로 분리: "2025-1학기" -> ["2025", "1학기"]
        String[] ys = yearSemester.split("-", 2); // ["2025", "1학기"]
        if (ys.length < 2) {
            throw new IllegalArgumentException("semester 형식이 올바르지 않습니다: " + semesterKey);
        }

        // 3. TermKey 객체에 담아 반환
        TermKey key = new TermKey();
        key.year = ys[0];          // "2025"
        key.semester = ys[1];      // "1학기"
        key.examType = examType;   // "중간고사" / "기말고사"
        return key;
    }

    // ---------------------------
    //  ChatBotController가 호출하는 API
    // ---------------------------

    /**
     * 1. 학년 목록 조회
     * 특정 학기/시험에 개설된 학년 목록을 중복 없이 반환
     */
    public List<String> getGrades(String semester) {
        // 1. 문자열 파싱
        TermKey key = parseSemesterKey(semester);

        // 2. DB에서 해당 학기/시험의 모든 데이터를 조회
        return examScheduleRepository
                .findByYearAndSemesterAndExamType(key.year, key.semester, key.examType)
                .stream()// 3. 조회된 List를 Stream으로 변환
                .map(ExamSchedule::getGradeLevel)// 4. 각 데이터에서 '학년(gradeLevel)' 정보만 추출
                .distinct()// 5. 중복된 학년 제거 (예: 1학년, 1학년 -> 1학년)
                .collect(Collectors.toList());// 6. 다시 List로 변환하여 반환
    }

    /**
     * 2. 과목 목록 조회
     * 특정 학기/시험/학년에 개설된 과목 목록을 중복 없이 반환
     */
    public List<String> getSubjects(String semester, String grade) {
        TermKey key = parseSemesterKey(semester);

        return examScheduleRepository
                .findByYearAndSemesterAndExamTypeAndGradeLevel(// 4가지 조건으로 검색
                        key.year, key.semester, key.examType, grade
                ).stream()
                .map(ExamSchedule::getSubjectName)// 과목명만 추출
                .distinct()// 중복 과목 제거
                .collect(Collectors.toList());
    }

    /**
     * 3. 교수 목록 조회
     * 특정 학기/시험/학년/과목에 해당하는 교수 목록을 중복 없이 반환
     */
    public List<String> getProfessors(String semester, String grade, String subject) {
        TermKey key = parseSemesterKey(semester);

        return examScheduleRepository
                .findByYearAndSemesterAndExamTypeAndGradeLevelAndSubjectName(// 5가지 조건으로 검색
                        key.year, key.semester, key.examType, grade, subject
                ).stream()
                .map(ExamSchedule::getProfessorName)// 교수명만 추출
                .distinct()// 중복 교수 제거
                .collect(Collectors.toList());
    }
    /**
     * 4. 최종 시험 정보 조회
     * 모든 조건(학기, 학년, 과목, 교수)에 맞는 상세 시험 정보를 반환
     * @return Map<String, ExamInfo> 프론트엔드에서 분반별(공통, 1분반...)로 처리하기 쉽도록 Map 형태로 반환
     */

    public Map<String, ExamInfo> getExamInfo(String semester,
                                             String grade,
                                             String subject,
                                             String professor) {

        TermKey key = parseSemesterKey(semester);


        List<ExamSchedule> schedules =
                examScheduleRepository
                        .findByYearAndSemesterAndExamTypeAndGradeLevelAndSubjectNameAndProfessorName(
                                key.year, key.semester, key.examType,
                                grade, subject, professor
                        );

        Map<String, ExamInfo> result = new LinkedHashMap<>();

        int idx = 1;
        for (ExamSchedule s : schedules) {
            ExamInfo info = new ExamInfo();

            // ExamSchedule 엔티티 → ExamInfo DTO 매핑
            info.setDate(s.getExamDate());
            info.setTime(s.getExamTime());
            info.setRoom(s.getExamRoom());
            info.setNote(s.getNote());

            // Map key 는 시험실 기준 + 중복 시 번호 붙이기
            String keyRoom = s.getExamRoom();
            if (keyRoom == null || keyRoom.isBlank()) {
                keyRoom = "option_" + idx;
            } else if (result.containsKey(keyRoom)) {
                keyRoom = keyRoom + "_" + idx;
            }

            result.put(keyRoom, info);
            idx++;
        }

        return result;
    }

    // (옵션) 필요하면 쓸 수 있는 메서드 – 지금 컨트롤러/프론트에서 안 쓰면 무시해도 됨
    public List<ExamSchedule> getExamSchedules(String year,
                                               String semester,
                                               String examType,
                                               String gradeLevel) {
        if (gradeLevel == null || gradeLevel.isBlank()) {
            return examScheduleRepository.findByYearAndSemesterAndExamType(
                    year, semester, examType
            );
        }
        return examScheduleRepository.findByYearAndSemesterAndExamTypeAndGradeLevel(
                year, semester, examType, gradeLevel
        );
    }
}
