package com.hichat.hichat.dto;

public class Scholarship {
    private String name;
    private double minGpa;
    private String amount;
    private String description;
    private boolean requireVolunteer;

    public Scholarship() {}

    public Scholarship(String name, double minGpa, String amount, String description, boolean requireVolunteer) {
        this.name = name;
        this.minGpa = minGpa;
        this.amount = amount;
        this.description = description;
        this.requireVolunteer = requireVolunteer;
    }

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
