package com.hichat.hichat.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * @Entity
 * 이 클래스가 데이터베이스 테이블과 매핑되는 JPA 엔티티임을 선언!
 */
@Entity
@Table(name = "EXAM_SCHEDULE")
@Getter // 모든 필드의 Getter 메서드 자동 생성 (getCode(), getName() 등)
@Setter // 모든 필드의 Setter 메서드 자동 생성 (setCode(), setName() 등)
@NoArgsConstructor(access = AccessLevel.PROTECTED) // protected 기본 생성자 자동 생성
public class ExamSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "year")
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
     * 전체 데이터를 한 번에 넣기 위한 편의용 생성자
     * (Service나 Test 코드에서 유용하게 쓰이게 됨)
     */
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