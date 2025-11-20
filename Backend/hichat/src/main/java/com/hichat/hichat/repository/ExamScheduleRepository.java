package com.hichat.hichat.repository;

import com.hichat.hichat.domain.ExamSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * @Repository
 * 이 인터페이스가 Spring Data JPA 리포지토리임을 선언
 * Spring이 이 인터페이스의 구현체를 자동으로 생성하여 Bean으로 등록함
 */
@Repository
/**
 * JpaRepository<ExamSchedule, Long>
 * - ExamSchedule: 이 리포지토리가 관리할 엔티티(테이블)
 * - Long: 이 엔티티의 Primary Key(ID)의 타입
 */
public interface ExamScheduleRepository extends JpaRepository<ExamSchedule, Long> {

    // --- Spring Data JPA 쿼리 메서드 ---
    // Spring Data JPA는 메서드 이름을 분석하여 자동으로 SQL 쿼리를 생성
    // "findBy" + "필드이름" + "And" + "필드이름" ... 형식

    // 특정 연도 + 학기 + 시험종류(중간/기말) 단위로 조회
    List<ExamSchedule> findByYearAndSemesterAndExamType(
            String year,
            String semester,
            String examType
    );
    // 특정 연도의 학기 + 시험종류(중간/기말) + 학년 단위로 조회
    List<ExamSchedule> findByYearAndSemesterAndExamTypeAndGradeLevel(
            String year,
            String semester,
            String examType,
            String gradeLevel
    );
    // 특정 연도의 학기 + 시험종류(중간/기말) + 학년 + 과목명 단위로 조회
    List<ExamSchedule> findByYearAndSemesterAndExamTypeAndGradeLevelAndSubjectName(
            String year,
            String semester,
            String examType,
            String gradeLevel,
            String subjectName
    );
    // **가장 구체적**으로 특정 연도의 학기 + 시험종류(중간/기말) + 학년 + 과목명 + 교수명 단위로 조회
    List<ExamSchedule> findByYearAndSemesterAndExamTypeAndGradeLevelAndSubjectNameAndProfessorName(
            String year,
            String semester,
            String examType,
            String gradeLevel,
            String subjectName,
            String professorName
    );
}
