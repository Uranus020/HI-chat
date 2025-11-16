package com.hichat.hichat.service;

import com.hichat.hichat.domain.ExamSchedule;
import com.hichat.hichat.dto.ExamInfo;
import com.hichat.hichat.repository.ExamScheduleRepository;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ExamService {

    private final ExamScheduleRepository examScheduleRepository;

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
     * "2025-1학기 중간고사" -> year="2025", semester="1학기", examType="중간고사"
     */
    private TermKey parseSemesterKey(String semesterKey) {
        if (semesterKey == null || semesterKey.isBlank()) {
            throw new IllegalArgumentException("semester 값이 비어 있습니다.");
        }

        // "2025-1학기 중간고사" 기준으로 공백으로 나눔
        String[] parts = semesterKey.trim().split("\\s+"); // ["2025-1학기", "중간고사"]
        if (parts.length < 2) {
            throw new IllegalArgumentException("semester 형식이 올바르지 않습니다: " + semesterKey);
        }

        String yearSemester = parts[0];        // "2025-1학기"
        String examType = parts[1];            // "중간고사" 또는 "기말고사"

        String[] ys = yearSemester.split("-", 2); // ["2025", "1학기"]
        if (ys.length < 2) {
            throw new IllegalArgumentException("semester 형식이 올바르지 않습니다: " + semesterKey);
        }

        TermKey key = new TermKey();
        key.year = ys[0];          // "2025"
        key.semester = ys[1];      // "1학기"
        key.examType = examType;   // "중간고사" / "기말고사"
        return key;
    }

    // ---------------------------
    //  기존 ExamService API 그대로
    // ---------------------------

    // 학기(semesterKey) 기준으로 존재하는 학년 리스트
    // 예: semester="2025-1학기 중간고사"
    public List<String> getGrades(String semester) {
        TermKey key = parseSemesterKey(semester);

        return examScheduleRepository
                .findByYearAndSemesterAndExamType(key.year, key.semester, key.examType)
                .stream()
                .map(ExamSchedule::getGradeLevel)
                .distinct()
                .collect(Collectors.toList());
    }

    // 학기 + 학년 → 과목 리스트
    public List<String> getSubjects(String semester, String grade) {
        TermKey key = parseSemesterKey(semester);

        return examScheduleRepository
                .findByYearAndSemesterAndExamTypeAndGradeLevel(
                        key.year, key.semester, key.examType, grade
                ).stream()
                .map(ExamSchedule::getSubjectName)
                .distinct()
                .collect(Collectors.toList());
    }

    // 학기 + 학년 + 과목 → 교수 리스트
    public List<String> getProfessors(String semester, String grade, String subject) {
        TermKey key = parseSemesterKey(semester);

        return examScheduleRepository
                .findByYearAndSemesterAndExamTypeAndGradeLevelAndSubjectName(
                        key.year, key.semester, key.examType, grade, subject
                ).stream()
                .map(ExamSchedule::getProfessorName)
                .distinct()
                .collect(Collectors.toList());
    }

    // 학기 + 학년 + 과목 + 교수 → 시험 정보 Map<String, ExamInfo>
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
