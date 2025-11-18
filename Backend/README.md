# HI-Chat 🤓- Backend
홍익대학교 학사 정보 챗봇 HI-Chat 의 Spring Boot 백엔드 서버입니다.

이 서버는 React 프론트엔드의 API 요청을 처리하고, H2 인메모리 데이터베이스와 연동하여 
시험 일정 조회, 학사 일정 조회, 성적 확인 일정 조회, 장학금 안내 등의 비즈니스 로직을 수행합니다.

-------------

## 🛠️ 주요 기술 스택: 
- **Framework**: Spring Boot
- **Language**: Java
- **Database**: H2 (In-Memory Mode)
- **Data Access**: Spring Data JPA
- **Build Tool**: Gradle

--------

## 🔷 실행 방법:
1) **프로젝트 열기**: IntelliJ IDEA(또는 선호하는 IDE)에서 Backend 폴더를 엽니다.
2) **Gradle 동기화**: IDE가 build.gradle파일을 읽고 필요한 라이브러리(의존성)를 모두 다운로드 할 때까지 기다립니다.
3) **Application 실행**: src/main/java/com/hichat/hichat/HichatApplication.java 파일을 찾아 main 메서드를 실행(Run)합니다.
4) **서버 확인**: 콘솔에 Started HichatApplication.. 로그가 뜨면 성공입니다.
                서버는 http://localhost:8080 포트에서 실행됩니다.

--------
   
## 💾 데이터베이스 (H2) 확인 방법:
이 프로젝트는 앱 실행 시 data.sql 파일의 데이터를 메모리에 자동으로 로드하는 H2 인메모리 데이터 베이스를 사용합니다.


앱이 실행중인 상태에서 H2 콘솔에 접속하여 DB데이터를 실시간으로 확인할 수 있습니다.
1. 웹 브라우저를 열고 http://localhost:8080/h2-console 주소로 접속합니다.
2. 로그인 화면에서 아래와 같이 정확히 입력하고 Connect 버튼을 누릅니다.
   - Driver Class: org.h2.Driver
   - JDBC URL: jdbc:j2:mem:hichatdb
   - User Name: sa
   - Password:(비워두기)
3. EXAM_SCHEDULE 테이블이 보이면 성공입니다.
   - SELECT *FROM EXAM_SCHEDULE; 쿼리로 데이터를 조회할 수 있습니다.

## 📥 프로젝트 구조:
```text
Backend
└── src
    └── main
        ├── java/com/hichat/hichat
        │   ├── HichatApplication.java     # (1) Spring Boot 메인 실행 파일
        │   ├── config
        │   │   └── CorsConfig.java        # (2) 프론트엔드(React) CORS 허용 설정
        │   ├── controller
        │   │   └── ChatBotController.java # (3) API 엔드포인트 정의
        │   ├── domain
        │   │   └── ExamSchedule.java      # (4) DB 테이블과 매핑되는 JPA 엔티티
        │   ├── dto
        │   │   ├── ExamInfo.java          # (5) API 응답용 DTO (시험 정보)
        │   │   ├── GPARequest.java        # (5) API 요청용 DTO (GPA)
        │   │   ├── GradeResultDate.java   # (5) API 응답용 DTO (성적 일정)
        │   │   └── Scholarship.java       # (5) API 응답용 DTO (장학금)
        │   ├── exception
        │   │   └── GlobalExceptionHandler.java # (6) 프로젝트 전역 오류 처리
        │   ├── repository
        │   │   └── ExamScheduleRepository.java # (7) JPA 리포지토리 (DB 쿼리)
        │   └── service
        │       ├── ExamService.java         # (8) 시험 일정 비즈니스 로직
        │       ├── GradeResultService.java  # (8) 성적 일정 비즈니스 로직
        │       └── ScholarshipService.java  # (8) 장학금 비즈니스 로직
        │
        └── resources
            ├── application.properties     # (9) 서버 포트, DB 연결, JPA 핵심 설정
            └── data.sql                   # (10) DB 초기화용 시험 데이터

```
----------

### 주요 파일 설명:
1) **HichatApplication.java**: Spring Boot 앱을 시작하는 메인 진입점입니다.
2) **CorsConfig.java**: localhost:3000 (React)에서 오는 API 요청을 허용합니다.
3) **ChatBotController.java**: 프론트엔드의 모든 /api/chat/** 요청을 받아 각 서비스로 분배합니다.
4) **ExamSchedule.java**: H2 DB의 EXAM_SCHEDULE 테이블과 1:1로 매핑되는 JAVA 객체(Entity)입니다.
5) **dto/**: 컨트롤러와 서비스 간, 또는 백엔드와 프론트엔드 간 데이터를 주고받기 위한 "데이터 전송 객체 폴더"입니다.
6) **GlobalExceptionHandler.java**: @Valid 유효성 검사 실패 등 프로젝트 전체의 오류를 잡아 일관된 JSON으로 응답합니다.
7) **ExamScheduleRepository.java**: ExamService가 DB에 쉽게 접근할 수 있도록 Spring Data JPA가 쿼리 메서드를 제공합니다.
8) **service/**: 챗봇의 실제 비즈니스 로직이 들어있는 파일들입니다.
9) **application.properties**: 서버 포트(8080), H2 DB 설정, data.sql 실행 순서를 보장하는 spring.jpa.defer-datasource-initialization=true 등 핵심 설정이 포함됩니다.
10) **data.sql**: 앱 실행 시 EXAM_SCHEDULE 테이블에 삽입될 초기 시험 일정 데이터입니다.


## ❕API 엔드포인트:
모든 API는 http://localhost:8080/api/chat 경로를 기본으로 합니다.


| Method | 경로       | 설명                                                               |
| --|----------|------------------------------------------------------------------|
|GET| /grades  | _시험 학년 조회_ : 특정 학기(semester쿼리)에 개설된 학년 목록을 반환                    |
|GET| /subjects | _시험 과목 조회_ : 특정 학기, 학년 (semester, grade쿼리)의 과목 목록을 반환            |
|GET| /professors | _시험 교수 조회_ : 특정 학기, 학년, 과목(semestr, grade, subject쿼리)의 교수 목록을 반환 |
|GET| /exam-info | _최종 시험 정보 조회_ : 모든 조건에 맞는 상세 시험 정보를 반환                           |
|GET| /grade-result-date| _성적 확인 일정 조회_ : 하드코딩된 성적 일정 목록을 반환                               |
|POST| /scholarship | _장학금 조회_ : RequestBody (JSON)로 받은 GPA와 봉사 여부를 기준으로 수혜 장학금 목록을 반환 | 


