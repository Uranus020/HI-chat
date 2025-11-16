package com.hichat.hichat.repository;

import com.hichat.hichat.domain.ExamSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamScheduleRepository extends JpaRepository<ExamSchedule, Long> {

    // 연도 + 학기 + 시험종류(중간/기말) 단위로 조회
    List<ExamSchedule> findByYearAndSemesterAndExamType(
            String year,
            String semester,
            String examType
    );

    List<ExamSchedule> findByYearAndSemesterAndExamTypeAndGradeLevel(
            String year,
            String semester,
            String examType,
            String gradeLevel
    );

    List<ExamSchedule> findByYearAndSemesterAndExamTypeAndGradeLevelAndSubjectName(
            String year,
            String semester,
            String examType,
            String gradeLevel,
            String subjectName
    );

    List<ExamSchedule> findByYearAndSemesterAndExamTypeAndGradeLevelAndSubjectNameAndProfessorName(
            String year,
            String semester,
            String examType,
            String gradeLevel,
            String subjectName,
            String professorName
    );
}
