package com.hichat.service.manager;

public class UserManager {

    public String getScholarshipInfo(String type) {
        if (type.equals("national")) {
            return "국가장학금: 신청기간은 매학기 초이며, 한국장학재단 홈페이지를 통해 신청합니다.";
        } else if (type.equals("campus")) {
            return "교내장학금: <a href='https://www.hongik.ac.kr/kr/education/school-scholarship.do'>바로가기</a>";
        }
        return "장학금 정보를 찾을 수 없습니다.";
    }
}