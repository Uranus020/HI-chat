package com.hichat.hichat.domain;

import jakarta.persistence.*;

/**
 * @Entity
 * 이 클래스가 데이터베이스 테이블과 매핑되는 JPA 엔티티임을 선언!
 */
@Entity
// @Table: 실제 DB의 테이블 이름('EXAM_SCHEDULE')을 명시적으로 연결하기
@Table(name = "EXAM_SCHEDULE") // ★ data.sql의 테이블 이름과 동일하게
public class ExamSchedule {

    /**
     * @Id: 이 필드가 테이블의 Primary Key(기본 키)임을 나타냄
     * @GeneratedValue(strategy = GenerationType.IDENTITY)
     * DB가 ID 값을 자동으로 생성(auto-increment)하도록 설정함
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * @Column(name = "...")
     * Java 필드명과 DB 컬럼명이 다를 경우 이름을 명시하거나,
     * 동일하더라도 명확하게 매핑하기 위해 사용함
     */
    @Column(name = "year")    // H2에서 YEAR 예약어지만, url에 NON_KEYWORDS=YEAR 있어서 사용 가능
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

    /**
     * 🚩JPA는 엔티티 객체를 생성할 때 기본 생성자를 필요로 하기에
     * protected로 선언하여 외부에서 실수로 호출하는 것을 방지하기!!
     */
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
