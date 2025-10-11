package com.hichat.service.manager;

import java.util.Map;

public class FacilityManager {

    public String getAcademicSchedule() {
        return "<iframe src='https://www.hongik.ac.kr/kr/education/academic-schedule.do'></iframe>";
    }

    public String getCampusContacts() {
        return "서울: 02-320-1114, 세종: 044-860-2114, 대학로: 02-3668-3700";
    }

    public String getCampusMap(String campus) {
        Map<String, String> map = Map.of(
            "seoul", "https://www.hongik.ac.kr/en/about/seoul-campus-map.do",
            "sejong", "https://www.hongik.ac.kr/en/about/sejong-campus-map.do",
            "daehakro", "https://www.hongik.ac.kr/en/about/daehakro-campus-map.do",
            "hwaseong", "https://www.hongik.ac.kr/en/about/hwaseong-campus-map.do"
        );
        return "<iframe src='" + map.getOrDefault(campus, "#") + "'></iframe>";
    }

    public String getFacilityInfo(String type) {
        switch (type) {
            case "cafe": return "카페드림, 켐퍼, 투썸플레이스";
            case "restaurant": return "학생식당, 향차이";
            default: return "해당 시설 정보를 찾을 수 없습니다.";
        }
    }
}