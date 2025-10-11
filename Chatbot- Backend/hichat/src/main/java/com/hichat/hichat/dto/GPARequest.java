package com.hichat.hichat.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;




public class GPARequest {
@DecimalMin(value = "0.0", message = "GPA는 0.0 이상이어야 합니다.")
@DecimalMax(value = "4.5", message = "GPA는 4.5 이하여야 합니다.")

private double gpa;
private boolean volunteer;

public double getGpa() { return gpa; }
public void setGpa(double gpa) { this.gpa = gpa; }
public boolean isVolunteer() { return volunteer; }
public void setVolunteer(boolean volunteer) { this.volunteer = volunteer; }
}