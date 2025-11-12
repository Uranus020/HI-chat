package com.hichat.hichat.dto;

public class ExamInfo {
    private String date;
    private String time;
    private String room;
    private String note;

    // 기본 생성자 
    public ExamInfo() {}

    //  전체 필드 초기화 생성자
    public ExamInfo(String date, String time, String room, String note) {
        this.date = date;
        this.time = time;
        this.room = room;
        this.note = note;
    }

    // Getter & Setter
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

    public String getRoom() {
        return room;
    }

    public void setRoom(String room) {
        this.room = room;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
