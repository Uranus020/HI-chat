package com.hichat.hichat.controller;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

//DTO 데어터 전송 객체 클래스들 import
import com.hichat.hichat.dto.ExamInfo;
import com.hichat.hichat.dto.GPARequest;
import com.hichat.hichat.dto.GradeResultDate;
import com.hichat.hichat.dto.Scholarship;

//Service 클래스들 import
import com.hichat.hichat.service.ExamService;
import com.hichat.hichat.service.GradeResultService;
import com.hichat.hichat.service.ScholarshipService;
import jakarta.validation.Valid;

/**
 * @RestController
 * 이 클래스가 RESTful API의 컨트롤러임
 * 이 클래스의 메서드들은 기본적으로 JSON 형태의 데이터들을 반환
 */
@RestController
@RequestMapping("/api/chat") // 이 컨트롤러의 모든 API는 "/api/chat"라는 공통 경로를 가짐


public class ChatBotController {

    // 의존성 주입하기 (Dependency Injection)
    // final 로 선언된 service들을 생성자를 통해 Spring이 자동으로 주입해줌
  private final ExamService examService;
  private final GradeResultService gradeResultService;
  private final ScholarshipService scholarshipService;

  public ChatBotController(ExamService examService,
                           GradeResultService gradeResultService,
                           ScholarshipService scholarshipService) {
    this.examService = examService;
    this.gradeResultService = gradeResultService;
    this.scholarshipService = scholarshipService;
  }

  // API 엔드포인트 정의

    /**
     * (시험) 학년 목록 조회
     * GET /api/chat/grades?semester=...
     * @RequestParam: URL의 쿼리 파라미터(예: ?semester=값)를 받아오기
     */
  @GetMapping("/grades")
  public List<String> getGrades(@RequestParam String semester) {
    return examService.getGrades(semester);
  }

    /**
     * (시험) 과목 목록 조회
     * GET /api/chat/subjects?semester=...&grade=...
     */
  @GetMapping("/subjects")
  public List<String> getSubjects(@RequestParam String semester,
                                  @RequestParam String grade) {
    return examService.getSubjects(semester, grade);
  }

    /**
     * (시험) 교수 목록 조회
     * GET /api/chat/professors?semester=...&grade=...&subject=...
     */
  @GetMapping("/professors")
  public List<String> getProfessors(@RequestParam String semester,
                                    @RequestParam String grade,
                                    @RequestParam String subject) {
    return examService.getProfessors(semester, grade, subject);
  }

    /**
     * (시험) 최종 시험 정보 조회
     * GET /api/chat/exam-info?semester=...&grade=...&subject=...&professor=...
     */
  @GetMapping("/exam-info")
  public Map<String, ExamInfo> getExamInfo(@RequestParam String semester,
                                           @RequestParam String grade,
                                           @RequestParam String subject,
                                           @RequestParam String professor) {
    return examService.getExamInfo(semester, grade, subject, professor);
  }

    /**
     * (성적) 성적 확인 일정 조회
     * GET /api/chat/grade-result-date
     */
  @GetMapping("/grade-result-date")
  public List<GradeResultDate> getGradeResultDate() {
      return gradeResultService.getDates();
  }
    /**
     * (장학금) 수혜 가능 장학금 조회
     * POST /api/chat/scholarship
     * @RequestBody: 프론트엔드가 보낸 JSON 본문을 GPARequest 객체로 변환
     * @Valid: GPARequest 객체에 정의된 유효성 검사(@DecimalMin 등)를 실행
     */
  @PostMapping(value = "/scholarship", consumes = "application/json", produces = "application/json")
  public List<Scholarship> getScholarship(@Valid @RequestBody GPARequest request) {
    return scholarshipService.getEligibleScholarships(request.getGpa(), request.isVolunteer());
  }
}
