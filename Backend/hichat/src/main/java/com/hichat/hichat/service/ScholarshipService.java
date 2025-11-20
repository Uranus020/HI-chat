package com.hichat.hichat.service;

import com.hichat.hichat.dto.Scholarship;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.ArrayList;


/**
 * @Service
 * 이 클래스가 서비스 컴포넌트임을 선언
 */
@Service
public class ScholarshipService {
    /**
     * 수혜 가능한 장학금 목록을 계산하여 반환
     * @param gpa 사용자가 입력한 평점 (예: 3.75)
     * @param volunteer 사회봉사 이수 여부 (true/false)
     * @return List<Scholarship> 수혜 가능한 장학금 DTO 리스트
     */
    public List<Scholarship> getEligibleScholarships(double gpa, boolean volunteer) {
        List<Scholarship> list = new ArrayList<>();

        // 홍익인간 (전액)
        if (gpa >= 4.0) {
            list.add(new Scholarship(
                "홍익인간",
                4.0,
                "전액",
                "GPA 4.0 이상(봉사시간 조건 없음)",
                false
            ));
        }

        // 자주 (80%) - 봉사 필요
        if (gpa >= 3.5 && volunteer) {
            list.add(new Scholarship(
                "자주",
                3.5,
                "80%",
                "필수조건: 봉사 15시간 이상 (표에 4학년 예외 주석은 학년정보가 없어서 미적용)",
                true
            ));
        }

        // 창조 (60%) - 봉사 필요
        if (gpa >= 3.5 && volunteer) {
            list.add(new Scholarship(
                "창조",
                3.5,
                "60%",
                "봉사시간 필요",
                true
            ));
        }

        // 협동 (40%) - 봉사 필요
        if (gpa >= 3.3 && volunteer) {
            list.add(new Scholarship(
                "협동",
                3.3,
                "40%",
                "봉사시간 필요",
                true
            ));
        }

        // 정진 (고정액) - 봉사 불필요
        if (gpa >= 3.0) {
            list.add(new Scholarship(
                "정진",
                3.0,
                "90만원",
                "사회봉사시간 없어도 가능",
                false
            ));
        }

        return list;
    }
}

