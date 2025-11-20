package com.hichat.hichat.dto;

/**
 * 최종 시험 정보 조회 API (/api/chat/exam-info)의 응답(Response) 본문에 사용될
 * DTO
 * ExamSchedule 엔티티의 모든 정보X
 * 프론트엔드에 "필요한" 정보(날짜, 시간, 강의실, 비고)만 담아두기
 */

public class ExamInfo {

    private String date;
    private String time;
    private String room;
    private String note;

    // 기본 생성자: JSON 라이브러리(Jackson)가 객체를 생성하기 위해 기본 생성자
    public ExamInfo() {
    }

    // 전체 필드 초기화 생성자 - Service 레이어에서 객체를 쉽게 생성하기 위한 생성자
    public ExamInfo(String date, String time, String room, String note) {
        this.date = date;
        this.time = time;
        this.room = room;
        this.note = note;
    }

    // Getter & Setter
    // Spring이 이 객체를 JSON으로 변환(Serialize)할 때 Getter가 필요함
    // Setter는 Jackson이 객체 생성 시 사용 가능
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
