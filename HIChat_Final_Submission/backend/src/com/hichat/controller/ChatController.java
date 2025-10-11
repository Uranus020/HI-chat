package com.hichat.controller;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/chat")
public class ChatController {

    @GetMapping("/faq")
    public String getFAQ(@RequestParam String topic) {
        return new FAQManager().getFAQ(topic);
    }

    @GetMapping("/scholarship")
    public String getScholarshipInfo(@RequestParam String type) {
        return new UserManager().getScholarshipInfo(type);
    }

    @GetMapping("/academic-schedule")
    public String getAcademicSchedule() {
        return new FacilityManager().getAcademicSchedule();
    }

    @GetMapping("/campus-contact")
    public String getCampusContacts() {
        return new FacilityManager().getCampusContacts();
    }

    @GetMapping("/campus-map")
    public String getCampusMap(@RequestParam String campus) {
        return new FacilityManager().getCampusMap(campus);
    }

    @GetMapping("/facility")
    public String getFacilityDetail(@RequestParam String type) {
        return new FacilityManager().getFacilityInfo(type);
    }
}