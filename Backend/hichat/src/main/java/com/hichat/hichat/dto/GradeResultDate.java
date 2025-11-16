package com.hichat.hichat.dto;

public class GradeResultDate {

    private String semester;   // 예: "2025-1학기"
    private String examType;   // 예: "학기성적" 또는 "중간고사"/"기말고사"
    private String date;       // 예: "6월 30일"
    private String time;       // 예: "오전 10시"

    public GradeResultDate() {
    }

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
