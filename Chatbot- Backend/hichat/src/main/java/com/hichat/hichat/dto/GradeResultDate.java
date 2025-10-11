package com.hichat.hichat.dto;

public class GradeResultDate {
    private String semester;
    private String date;
    private String time;

    public GradeResultDate() {}

    public GradeResultDate(String semester, String date, String time) {
        this.semester = semester;
        this.date = date;
        this.time = time;
    }

    public String getSemester() {
        return semester;
    }

    public void setSemester(String semester) {
        this.semester = semester;
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
