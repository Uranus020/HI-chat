package com.hichat.hichat.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;

/**
 * 장학금 조회 API(/api/chat/scholarship)의 POST 요청 본문인 Request Body를 담는
 * DTO
 */


public class GPARequest {
    /**
     * @DecimalMin
     * @DecimalMax
     * Controller의 @Valid 어노테이션과 연동되어, GPA 값이 0.0 ~ 4.5 사이인지 자동으로 검증
     * if 유효 X: GlobalExceptionHandler가 오류를 처리함
     */
    @DecimalMin(value = "0.0", message = "GPA는 0.0 이상이어야 합니다.")
    @DecimalMax(value = "4.5", message = "GPA는 4.5 이하여야 합니다.")

private double gpa;
private boolean volunteer;

public double getGpa() { return gpa; }
public void setGpa(double gpa) { this.gpa = gpa; }
public boolean isVolunteer() { return volunteer; }
public void setVolunteer(boolean volunteer) { this.volunteer = volunteer; }
}