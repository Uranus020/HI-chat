package com.hichat.hichat.controller;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hichat.hichat.dto.ExamInfo;
import com.hichat.hichat.dto.GPARequest;
import com.hichat.hichat.dto.GradeResultDate;
import com.hichat.hichat.dto.Scholarship;
import com.hichat.hichat.service.ExamService;
import com.hichat.hichat.service.GradeResultService;
import com.hichat.hichat.service.ScholarshipService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/chat")


public class ChatBotController {

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

  @GetMapping("/grades")
  public List<String> getGrades(@RequestParam String semester) {
    return examService.getGrades(semester);
  }

  @GetMapping("/subjects")
  public List<String> getSubjects(@RequestParam String semester,
                                  @RequestParam String grade) {
    return examService.getSubjects(semester, grade);
  }

  @GetMapping("/professors")
  public List<String> getProfessors(@RequestParam String semester,
                                    @RequestParam String grade,
                                    @RequestParam String subject) {
    return examService.getProfessors(semester, grade, subject);
  }

  @GetMapping("/exam-info")
  public Map<String, ExamInfo> getExamInfo(@RequestParam String semester,
                                           @RequestParam String grade,
                                           @RequestParam String subject,
                                           @RequestParam String professor) {
    return examService.getExamInfo(semester, grade, subject, professor);
  }

  @GetMapping("/grade-result-date")
  public GradeResultDate getGradeResultDate() {
    return gradeResultService.getDate();
  }

 
  @PostMapping(value = "/scholarship", consumes = "application/json", produces = "application/json")
  public List<Scholarship> getScholarship(@Valid @RequestBody GPARequest request) {
    return scholarshipService.getEligibleScholarships(request.getGpa(), request.isVolunteer());
  }
}
