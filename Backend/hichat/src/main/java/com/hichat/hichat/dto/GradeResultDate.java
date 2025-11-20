package com.hichat.hichat.dto;

/**
 * 성적 확인 일정 API (/api/chat/grade-result-date)의 응답(Response) 본문에 사용될
 * DTO
 */
public class GradeResultDate {

    private String semester;   // 예: "2025-1학기"
    private String examType;   // 예: "학기성적" 또는 "중간고사"/"기말고사"
    private String date;       // 예: "6월 30일"
    private String time;       // 예: "오전 10시"

    // Service 레이어에서 "하드코딩"된 데이터를 생성하기 위한 생성자
    // 기본 생성자 대신에 있는 정보만 갖고오기 때문에 이 생성자를 씀
    public GradeResultDate(String semester, String examType, String date, String time) {
        this.semester = semester;
        this.examType = examType;
        this.date = date;
        this.time = time;
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

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getTime() {
        return time;
    }

    public void setTime(String time) {
        this.time = time;
    }
}
