package com.hichat.hichat.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "EXAM_SCHEDULE") // ★ data.sql의 테이블 이름과 동일하게
public class ExamSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "year")          // H2에서 YEAR 예약어지만, url에 NON_KEYWORDS=YEAR 있어서 사용 가능
    private String year;

    @Column(name = "semester")
    private String semester;

    @Column(name = "exam_type")
    private String examType;

    @Column(name = "grade_level")
    private String gradeLevel;

    @Column(name = "subject_name")
    private String subjectName;

    @Column(name = "professor_name")
    private String professorName;

    @Column(name = "exam_date")
    private String examDate;

    @Column(name = "exam_time")
    private String examTime;

    @Column(name = "exam_room")
    private String examRoom;

    @Column(name = "note")
    private String note;

    protected ExamSchedule() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getYear() {
        return year;
    }

    public void setYear(String year) {
        this.year = year;
    }

    public String getSemester() {
        return semester;
    }

    public void setSemester(String semester) {
        this.semester = semester;
    }

    public String getExamType() {
        return examType;
    }

    public void setExamType(String examType) {
        this.examType = examType;
    }

    public String getGradeLevel() {
        return gradeLevel;
    }

    public void setGradeLevel(String gradeLevel) {
        this.gradeLevel = gradeLevel;
    }

    public String getSubjectName() {
        return subjectName;
    }

    public void setSubjectName(String subjectName) {
        this.subjectName = subjectName;
    }

    public String getProfessorName() {
        return professorName;
    }

    public void setProfessorName(String professorName) {
        this.professorName = professorName;
    }

    public String getExamDate() {
        return examDate;
    }

    public void setExamDate(String examDate) {
        this.examDate = examDate;
    }

    public String getExamTime() {
        return examTime;
    }

    public void setExamTime(String examTime) {
        this.examTime = examTime;
    }

    public String getExamRoom() {
        return examRoom;
    }

    public void setExamRoom(String examRoom) {
        this.examRoom = examRoom;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public ExamSchedule(String year, String semester, String examType,
                        String gradeLevel, String subjectName, String professorName,
                        String examDate, String examTime, String examRoom, String note) {
        this.year = year;
        this.semester = semester;
        this.examType = examType;
        this.gradeLevel = gradeLevel;
        this.subjectName = subjectName;
        this.professorName = professorName;
        this.examDate = examDate;
        this.examTime = examTime;
        this.examRoom = examRoom;
        this.note = note;
    }


}
