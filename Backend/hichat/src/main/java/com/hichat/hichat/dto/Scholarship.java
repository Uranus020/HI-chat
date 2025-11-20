package com.hichat.hichat.dto;

/**
 * 장학금 조회 API (/api/chat/scholarship)의 응답(Response) 본문에 사용될
 * DTO
 */
public class Scholarship {
    private String name;
    private double minGpa;
    private String amount;
    private String description;
    private boolean requireVolunteer;

    // JSON 라이브러리를 위한 기본 생성자
    public Scholarship() {}

    // Serivce 레이어에서 객체를 쉽게 생성하기 위한 생성자
    public Scholarship(String name, double minGpa, String amount, String description, boolean requireVolunteer) {
        this.name = name;
        this.minGpa = minGpa;
        this.amount = amount;
        this.description = description;
        this.requireVolunteer = requireVolunteer;
    }

    // --- Getter & Setter ---
    // JSON 변환을 위해 필요함
    public String getName() { return name; }
    public double getMinGpa() { return minGpa; }
    public String getAmount() { return amount; }
    public String getDescription() { return description; }
    public boolean isRequireVolunteer() { return requireVolunteer; }

    public void setName(String name) { this.name = name; }
    public void setMinGpa(double minGpa) { this.minGpa = minGpa; }
    public void setAmount(String amount) { this.amount = amount; }
    public void setDescription(String description) { this.description = description; }
    public void setRequireVolunteer(boolean requireVolunteer) { this.requireVolunteer = requireVolunteer; }

}
