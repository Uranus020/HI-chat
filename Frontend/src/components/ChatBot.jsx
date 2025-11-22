import { useEffect, useState } from "react";
import { MessageCircle, Send, ExternalLink } from "lucide-react";
import "./ChatBot.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// semi NLP가 의도를 추출 -> 첫화면의 메뉴들 중 특정 메뉴(버튼)으로 자동적으로 연결할 수 있게 해주는 mapping표
const intentMap = {
  exam_schedule: "시험 일정 조회",
  academic_calendar: "학사 일정 확인",
  grade_result_date: "성적 확인 일정",
  scholarship_info: "장학금 안내",
};

// 백엔드에 요청을 보내는 함수

async function fetchJson(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    // 에러 처리
    const err = new Error(data?.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// 중간 인지 기말인지 텍스트로부터 판단하는 함수

function detectExamType(text) {
  const t = text.toLowerCase();
  if (t.includes("중간")) return "중간고사";
  if (t.includes("기말")) return "기말고사";
  return "";
}

/**
 *  사용자가 입력한 문자열이 어떤 과목명과 얼마나 비슷한지 점수로 계산한다
 * - 완전 일치 / 부분 포함 / 글자 겹침 정도를 종합해서 score 계산
 */
function scoreSubjectMatch(input, subject) {
  /**
   * 예를 들어 사용자가 "운체 중간"이라고 채팅창에 입력했다고 하고 extractEntities를 통해서 subject를 운영체제라고 찾은 경우를 생각해보자
   * input : "운체 중간" / subject : "운영체제"
   */

  const t = input.replace(/\s+/g, ""); // 해당 input의 여백 제거
  const s = subject.replace(/\s+/g, "");

  if (!t || !s) return 0; // t 나 s가 빈문자열이면 점수 : 0점

  if (t === s) return 100; // 두 문자열이 완전히 같으면 점수 : 100점

  // 입력값이 과목명 안에 포함되고 입력값의 길이가 두 글자 이상이면 (ex. "운영체제" vs "운체") 점수 : 90점
  if (s.includes(t) && t.length >= 2) return 90;

  // 과목명 전체가 입력값 안에 포함될때
  // 예를 들어 사용자가 "운영체제 중간고사 언제?" 라고 입력하면 과목명은 "운영체제" 일 때,
  // t.includes(s)가 성립 && 과목명이 두 글자 이상일 때 점수 : 80점
  if (t.includes(s) && s.length >= 2) return 80;

  // ⬇️  글자 하나씩 비교해서 겹치는 글자수를 센다
  let common = 0;
  const seen = new Set(); // 같은 글자가 여러번 중복되는 것을 방지

  for (const ch of t) {
    if (s.includes(ch) && !seen.has(ch)) {
      seen.add(ch);
      common++;
    }
  }

  if (common >= 3) return 40 + common; // 글자 3개 이상 겹치면  꽤 높은 매칭이라고 판단함

  if (common === 2) return 30; // 겹치는 글자가 2개 이면 어는 정도 비슷하다고 판단
  return 0; // 거의 안 비슷한 경우 점수 : 0점
}

/**
 * 텍스트에서 과목명 엔티티 추출 ⏳ (백엔드에서 받아온 전체 과목 리스트 사용)
 */
function extractEntities(text, allSubjects) {
  const entities = [];
  const t = text.toLowerCase();

  // 1) 학년
  if (t.includes("1학년")) entities.push({ entity: "grade", value: "1학년" });
  if (t.includes("2학년")) entities.push({ entity: "grade", value: "2학년" });
  if (t.includes("3학년")) entities.push({ entity: "grade", value: "3학년" });
  if (t.includes("4학년")) entities.push({ entity: "grade", value: "4학년" });

  // 2) 학기: 예) "2025-2학기"
  const semesterRegex = /(202[0-9]-[12]학기)/;
  const sem = text.match(semesterRegex);

  if (sem) {
    entities.push({ entity: "semester", value: sem[1] });
  } else {
    // 연도 없이 "1학기"/"2학기"만 있으면 기본 연도(예: 2025)로 보정
    const simpleSem = text.match(/([12])학기/);
    if (simpleSem) {
      const year = "2025"; // 필요하면 현재 연도로 바꾸기
      entities.push({
        entity: "semester",
        value: `${year}-${simpleSem[1]}학기`,
      });
    }
  }

  // 3)  백엔드에서 가져온 전체 과목 목록을  기반으로 과목명을  부분 매칭
  if (Array.isArray(allSubjects) && allSubjects.length > 0) {
    // 백엔드로부터 받아온 정보를 토대로 만들어진 allSubjects 리스트가 배열 이고 배열의 크기가 0보다 크면 아래를 실행한다.

    let best = null; // best : 가장 높은 점수를 받은 과목을 저장

    allSubjects.forEach((sub) => {
      const score = scoreSubjectMatch(text, sub); // 각 과목마다 scoreSubjectMatch("운체 중간","운영체제")를 계산 -> 30점

      if (score > 0) {
        if (!best || score > best.score) {
          // 가장 높은 점수를 받는 과목을 선택
          best = { subject: sub, score }; // 지금까지 비교한 것 중 가장 점수가 높은 과목을 저장함.
        }
      }
    });

    //threshold 체크
    if (best && best.score >= 30) {
      // 가장 비슷한 과목의 좀수가 30점 이상 -> subject 엔티티로 인정

      entities.push({ entity: "subject", value: best.subject });
    }
  }

  return entities;
}

/**
 *   과목 이름 + 시험 종류(중간/기말) 을 통해 <어느 학기, 몇학년 과목>인지 찾아주는 함수
 */
async function autoResolveExam(
  subject,
  examType,
  { gradeHint, semesterHint } = {} // gradeHint : 사용자가 학년을 직접 말해주면 존재 / semesterHInt : 사용자가 2025-1학기라고 말해주면 존재
) {
  let semesterCandidates; // 어느 학기들을 검사해볼지 담아 둘 배열

  if (semesterHint) {
    // semesterHint가 존재 -> 그 학기만 검사하면 됨
    semesterCandidates = [`${semesterHint} ${examType}`];
  } else {
    // 사용자가 학기를 말해주지 않은 경우
    semesterCandidates =
      examType === "중간고사"
        ? ["2025-1학기 중간고사", "2025-2학기 중간고사"]
        : ["2025-1학기 기말고사", "2025-2학기 기말고사"];
  }

  const gradeCandidates = gradeHint // 사용자가 학년을 말해주면 그 gradeHint를 쓰고 말해주지 않으면 전체 학년을 찾아본다
    ? [gradeHint]
    : ["1학년", "2학년", "3학년", "4학년"];

  const matches = [];

  // 학기 후보 x 학년 후보를 돌면서
  // 백엔드의 /api/chat/subjects의 정보를 fetch해 어떤 과목들이 있는지 그 리스트를 받아온다.

  for (const semester of semesterCandidates) {
    for (const grade of gradeCandidates) {
      try {
        const subjects = await fetchJson(
          `/api/chat/subjects?semester=${encodeURIComponent(
            semester
          )}&grade=${encodeURIComponent(grade)}`
        );

        if (Array.isArray(subjects) && subjects.includes(subject)) {
          matches.push({ semester, grade });
          // "운체 중간" -> semester : "25-2학기 중간고사" grade :" 3학년"
        }
      } catch {
        // 실패하면 에러 무시
      }
    }
  }

  return matches;
}

function ChatBot() {
  // 말풍선 message 관리
  const [messages, setMessages] = useState([
    {
      // 첫 화면에 보이는 메세지 아래와 같이 초기화

      id: "1",
      type: "bot", // 챗봇이 대화를 시작
      // 말풍선 속 들어갈 대화 text
      content:
        "안녕하세요! 홍익대학교 학사 정보 챗봇입니다. 🤓\n\n원하시는 서비스를 선택해주세요.",
      options: [
        // 말풍선 안에 표시될 버튼 목록
        "시험 일정 조회",
        "학사 일정 확인",
        "성적 확인 일정",
        "장학금 안내",
      ],
    },
  ]);

  /**
   *  대화 흐름 관리
*  I. flow의 종류 

1.   "initial": 처음 메뉴 화면

2. "exam-semester": “어느 학기/중간/기말인지” 고르는 단계

3. "exam-grade": 학년 선택 단계

4. "exam-subject": 과목 선택 단계

5. "exam-professor": 교수 선택 단계

6. "scholarship": 장학금 GPA 입력 단계
*/
  const [conversationState, setConversationState] = useState({
    flow: "initial",
    selectedSemester: "", // 선택된 학기 예) 2025-2학기
    selectedGrade: "", // 선택된 학년 예)  3학년
    selectedSubject: "", // 선택된 과목 예) 운영체제
    selectedProfessor: "", // 선택된 교수명 예) 이장호 교수님
  });

  const [composerValue, setComposerValue] = useState(""); // 자유 입력창과 관련된 value들
  const [inputValue, setInputValue] = useState(""); // 말풍선 안 GPA 입력용
  const [pendingGPA, setPendingGPA] = useState(null); // 저장된 GPA 관리
  const [isTyping, setIsTyping] = useState(false);

  //  백엔드에서 받아오는 전체 과목 목록 관리
  const [allSubjects, setAllSubjects] = useState([]);

  useEffect(() => {
    async function loadAllSubjects() {
      /**
       * 2025-1/2 학기 x 1~4학년의 모든 조합에 대해
       * 백엔드의 /api/chat/subject?... 에 저장된 과목명들을 set에 넣은 후 allSubjects useState에 저장한다
       *
       * ✨ 주 목적 : 홍익대 컴퓨터공학과의 전공 과목들(예: 자료구조, 운영체제, 데이터베이스 등등 ) 을 미리 다 가지고 있게 한다
       * + 예를 들어 운영체제를 full이름이 아닌 운체 , 디지털시스템설계를 디시설로 입력해도 추정할 수 있게 한다
       */
      const set = new Set();

      const semesterCandidates = [
        // 학기 후보들
        "2025-1학기 중간고사",
        "2025-1학기 기말고사",
        "2025-2학기 중간고사",
        "2025-2학기 기말고사",
      ];

      const gradeCandidates = ["1학년", "2학년", "3학년", "4학년"]; // 학년 후보들

      for (const sem of semesterCandidates) {
        for (const grade of gradeCandidates) {
          try {
            const subs = await fetchJson(
              `/api/chat/subjects?semester=${encodeURIComponent(
                sem
              )}&grade=${encodeURIComponent(grade)}`
            );
            subs.forEach((s) => set.add(s.trim()));
          } catch {}
        }
      }

      setAllSubjects([...set]);
    }

    loadAllSubjects();
  }, []);

  //  ✚ 💬  말풍선 추가해주는 함수
  const addMessage = (type, content, options, inputType, link) => {
    const newMessage = {
      id: Date.now().toString(), // 현재 시각을 기준으로 unique 한 id를 생성
      type, // bot 인지 사용자인지 구분 "bot" , "user" 중 하나
      content, // 말풍선에 들어갈 text
      options, // 말풍선에 들어갈 버튼 목록
      inputType, // 말풍선에 들어갈 입력창(ex. gpa)
      link, // 외부 url(ex. 학사 일정 홈페이지로 연결 )
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  // Semi NLP - 간단한 키워드 매칭으로 intent를 추론하는 rule-based  함수

  async function semiNLP(text) {
    const t = text.toLowerCase();
    let intent = null;

    // intent 추출
    if (
      t.includes("시험일정") ||
      t.includes("중간") ||
      t.includes("기말") ||
      t.includes("시험")
    )
      intent = "exam_schedule";
    // 시험 일정 키워드가 있을 경우 intent를 "exam_schedule"로 매핑
    else if (t.includes("학사") || t.includes("학사일정"))
      intent = "academic_calendar";
    // 학사 일정 관련 키워드 : intent - > "academic_calender"로 매핑
    else if (t.includes("성적"))
      // 성적 열람 관련 키워드는 "grade_result_date"로 intent를 매핑
      intent = "grade_result_date";
    else if (t.includes("장학")) intent = "scholarship_info"; // 장학금 관련은 "scholarship_info"로 intent를 매핑

    const entities = extractEntities(text, allSubjects);

    if (!intent) {
      const hasStudyEntity = entities.some((e) =>
        ["grade", "subject", "semester"].includes(e.entity)
      );
      if (hasStudyEntity) intent = "exam_schedule";
    }

    return {
      output: {
        intents: intent ? [{ intent, confidence: 0.9 }] : [],
        entities,
        generic: intent
          ? [{ text: "요청을 이해했어요. 관련 메뉴로 이동합니다." }]
          : [],
      },
    };
  }

  // 엔티티 → state 반영
  function applyEntitiesToState(entities) {
    const getVal = (name) => entities.find((e) => e.entity === name)?.value;

    const semester = getVal("semester");
    const grade = getVal("grade");
    const subject = getVal("subject");
    const professor = getVal("professor");

    setConversationState((prev) => ({
      ...prev,
      selectedSemester: semester ?? prev.selectedSemester,
      selectedGrade: grade ?? prev.selectedGrade,
      selectedSubject: subject ?? prev.selectedSubject,
      selectedProfessor: professor ?? prev.selectedProfessor,
    }));
  }

  /**
   * 사용자 입력을 통해 여러가지 버튼 flow들을 건너띄고  바로 시험 일정까지 점프하기
   * - "운체 중간" → 운영체제 과목, 중간고사, 학기/학년 자동 추론 후 교수 선택 단계로 이동
   */
  async function handleExamFromNLP(text, entities) {
    const examType = detectExamType(text); // 조회하고자 하는 시험이 중간고사인지 기말고사인지 판단

    const subject = entities.find((e) => e.entity === "subject")?.value;

    if (!examType || !subject) return false;

    //  NLP에서 뽑은 학년/학기 힌트
    const gradeHint = entities.find((e) => e.entity === "grade")?.value;
    const semesterHint = entities.find((e) => e.entity === "semester")?.value;

    // 학기 + 학년 조합 자동 탐색
    // 힌트를 autoResolveExam으로 전달
    const matches = await autoResolveExam(subject, examType, {
      gradeHint,
      semesterHint,
    });

    // 딱 한 개만 찾은 경우에만 자동 확정 바로 교수님 선택으로 넘어간다
    if (matches.length === 1) {
      const { semester, grade } = matches[0];

      setConversationState((prev) => ({
        ...prev,
        flow: "exam-professor",
        selectedSemester: semester,
        selectedGrade: grade,
        selectedSubject: subject,
      }));

      try {
        const professors = await fetchJson(
          // 교수 목록을 가져오고 존재하면 챗봇에서 메세지를 보낸다.
          `/api/chat/professors?semester=${encodeURIComponent(
            semester
          )}&grade=${encodeURIComponent(grade)}&subject=${encodeURIComponent(
            subject
          )}`
        );

        if (Array.isArray(professors) && professors.length > 0) {
          addMessage(
            "bot",
            `${semester} ${grade} [${subject}] ${examType}입니다.\n교수님을 선택해주세요.`,
            professors
          );
        } else {
          addMessage("bot", "해당 과목의 교수 정보를 찾을 수 없습니다.", [
            "처음으로",
          ]);
          setConversationState({ flow: "initial" });
        }
      } catch (e) {
        addMessage("bot", `교수 목록 조회 실패: ${e.message}`, ["처음으로"]);
        setConversationState({ flow: "initial" });
      }

      return true;
    }

    // 후보가 없거나 2개 이상이면 자동 추론 포기 → 기존 버튼 플로우 사용
    return false;
  }

  // ⬇️ 사용자가 채팅창에 챗봇에 물어봤을 때 실행되는 함수

  const handleComposerSubmit = async (e) => {
    e.preventDefault();

    const text = composerValue.trim();
    if (!text) return;

    addMessage("user", text); // 사용자가 입력한 텍스트를 채팅창에 사용자의 말풍선으로 추가 (화면에 표시) ex. 운체 중간 언제야?

    setComposerValue(""); // 입력창 비우기

    if (conversationState.flow !== "initial") return;
    // 초기 화면이 아닐경우 NLP로 해석x 즉 이미 어떤 플로우가  진행 중이면 채팅창 인식은 하지 않는다.

    try {
      setIsTyping(true);

      const data = await semiNLP(text); // semiNLP 함수를 실행해 intent 와 entities를 추출한 후 data로 받아온다
      // 예를 들어 운체 중간 -> intent : exam_schedule  /  entities : {subject : 운영체제 }

      const entities = data.output?.entities || [];

      const generic = (data.output?.generic || []) // 챗봇이 바로 말할 수 있는 문장들 가져옴
        .map((g) => g.text) // 객체 배열에서 text 만 가져오기
        .filter(Boolean); // 빈 문자열 혹은 null undefined는 제거

      if (generic.length) {
        addMessage("bot", generic.join("\n")); // 보통 "요청을 이해했어요. 관련 메뉴로 이동합니다." 이 문구를 내보냄
      }

      applyEntitiesToState(entities); // 엔티티를 state에 반영

      const top = data.output?.intents?.[0]; // 가장 신뢰도가 높은 intent 가져옴
      const minConfidence = 0.45; // 최소 신뢰도 : 0.45 (watson 기준 따름 )
      const mapped =
        top?.intent && top.confidence >= minConfidence
          ? intentMap[top.intent]
          : null;

      // 시험 일정 intent → 자동 추론 먼저 시도
      if (mapped === "시험 일정 조회") {
        const autoOk = await handleExamFromNLP(text, entities);
        // handleOptionClick로 가기전에 handleExamFromNLP를 먼저 호출해 자동으로 끝까지 갈 수 있는 지 시도한다.
        if (!autoOk) {
          await handleOptionClick(mapped);
        }
        return;
      }

      if (!mapped) {
        addMessage("bot", "아래에서 원하시는 서비스를 선택해주세요.", [
          "시험 일정 조회",
          "학사 일정 확인",
          "성적 확인 일정",
          "장학금 안내",
        ]);
        return;
      }

      await handleOptionClick(mapped);
    } catch (err) {
      addMessage("bot", `NLP 오류: ${err.message}`);
    } finally {
      setIsTyping(false);
    }
  };

  //  ✅ 사용자가 메뉴 버튼 클릭 시 실행되는 handleOptionClick
  const handleOptionClick = async (option) => {
    addMessage("user", option); // 사용자가 클릭한 버튼을 user쪽 말풍선으로 채팅창에  바로 표시

    setTimeout(async () => {
      // ① 초기 메뉴 단계
      if (conversationState.flow === "initial") {
        switch (
          option // 사용자가 누른 버튼에 따라 분기
        ) {
          case "시험 일정 조회": {
            setConversationState((prev) => ({
              // flow 변경
              ...prev,
              flow: "exam-semester",
            }));
            addMessage("bot", "조회하실 학기와 시험을 선택해주세요.", [
              "2025-1학기 중간고사",
              "2025-1학기 기말고사",
              "2025-2학기 중간고사",
              "2025-2학기 기말고사",
            ]);
            return;
          }
          case "학사 일정 확인": {
            // 사용자가 누른 버튼 : 학사 일정 확인일 때
            addMessage(
              "bot",
              "홍익대학교 공식 학사 일정 페이지로 이동합니다.\n\n아래 버튼을 클릭하여 최신 학사 일정을 확인하세요.",
              ["홍익대학교 학사 일정 페이지"],
              undefined,
              "https://www.hongik.ac.kr/kr/education/academic-schedule.do" // 학사 일정 링크
            );
            setTimeout(() => {
              // 학사 일정 정보 링크를 제공한 후 1초 뒤에 처음 화면 안내하는 메세지 보내기
              addMessage("bot", "다른 서비스를 이용하시겠습니까?", [
                "처음으로",
              ]);
            }, 1000);
            return;
          }
          case "성적 확인 일정": {
            // 성적 확인 일정은 백엔드에서 관리하므로 해당 정보를 백엔드로부터 fetch해옴
            try {
              const gradeResults = await fetchJson(
                "/api/chat/grade-result-date"
              );

              if (!Array.isArray(gradeResults) || gradeResults.length === 0) {
                addMessage("bot", "성적 확인 일정이 아직 등록되지 않았습니다.");
              } else {
                // 성적 확인 일정 fetch 성공시

                let messageContent = "📅 성적 확인 일정 안내\n";
                gradeResults.forEach((result) => {
                  messageContent += `\n• 학기: ${result.semester}\n• 성적 열람 시작일: ${result.date}\n• 시작 시간: ${result.time}\n`;
                });
                messageContent +=
                  "\n학사정보시스템을 통해 확인하실 수 있습니다.";

                addMessage("bot", messageContent);
              }
            } catch (e) {
              addMessage("bot", `성적 일정 조회 실패: ${e.message}`);
            }

            setTimeout(() => {
              // 성적 일정 정보를 제공한 후 1초 뒤에 처음 화면 안내하는 메세지 보내기
              addMessage("bot", "다른 서비스를 이용하시겠습니까?", [
                "처음으로",
              ]);
            }, 1000);

            return;
          }
          case "장학금 안내": {
            setConversationState({ flow: "scholarship" });
            addMessage(
              "bot",
              "교내 장학금 수혜 가능 여부를 확인해드리겠습니다.\n\n본인의 평점을 입력해주세요. (예: 3.75)",
              [],
              "gpa"
            );
            return;
          }
          case "처음으로": {
            // 처음으로 눌렀을 때 flow를 다시 initial로 변경한다
            setConversationState({
              flow: "initial",
              selectedSemester: "",
              selectedGrade: "",
              selectedSubject: "",
              selectedProfessor: "",
            });
            addMessage(
              "bot",
              "처음 메뉴로 돌아갑니다.\n\n원하시는 서비스를 선택해주세요.",
              [
                "시험 일정 조회",
                "학사 일정 확인",
                "성적 확인 일정",
                "장학금 안내",
              ]
            );
            return;
          }
          default:
            break;
        }
      }

      // ② 현재 flow의 상태가 exam-semester인 경우 ->  학년 선택 단계로
      if (conversationState.flow === "exam-semester") {
        setConversationState((prev) => ({
          ...prev,
          flow: "exam-grade",
          selectedSemester: option,
        }));
        addMessage("bot", "조회하실 학년을 선택해주세요.", [
          "1학년",
          "2학년",
          "3학년",
          "4학년",
        ]);
        return;
      }

      // ③ exam-grade: 학년 선택 후 과목 목록 조회
      if (conversationState.flow === "exam-grade") {
        try {
          const subjects = await fetchJson(
            // 백엔드로부터 사용자가 선택한 학기와 학년에 맞는 과목들을 리스트로 subjects 로 받아온다
            // encodeURIComponent : URL 안에 띄어쓰기나 특수문자가 있을 때 URL이 깨지지 않게 하기위해 안전하게 인코딩해주는 함수
            `/api/chat/subjects?semester=${encodeURIComponent(
              conversationState.selectedSemester
            )}&grade=${encodeURIComponent(option)}`
          );

          if (subjects.length > 0) {
            setConversationState((prev) => ({
              ...prev,
              flow: "exam-subject",
              selectedGrade: option,
            }));
            addMessage("bot", "조회하실 과목을 선택해주세요.", subjects);
          } else {
            addMessage("bot", "해당 학년의 시험 정보가 없습니다. 😢", [
              "처음으로",
            ]);
            setConversationState({ flow: "initial" });
          }
        } catch (e) {
          addMessage("bot", `과목 목록 조회 실패: ${e.message}`, ["처음으로"]);
          setConversationState({ flow: "initial" });
        }
        return;
      }

      // ④ exam-subject: 과목 선택 후 교수 목록 조회
      if (conversationState.flow === "exam-subject") {
        try {
          const professors = await fetchJson(
            `/api/chat/professors?semester=${encodeURIComponent(
              conversationState.selectedSemester
            )}&grade=${encodeURIComponent(
              conversationState.selectedGrade
            )}&subject=${encodeURIComponent(option)}`
          );
          if (professors.length > 0) {
            setConversationState((prev) => ({
              ...prev,
              flow: "exam-professor",
              selectedSubject: option,
            }));
            addMessage("bot", "교수님을 선택해주세요.", professors);
          } else {
            addMessage("bot", "교수님 정보가 없습니다. 😢", ["처음으로"]);
            setConversationState({ flow: "initial" });
          }
        } catch (e) {
          addMessage("bot", `교수 목록 조회 실패: ${e.message}`, ["처음으로"]);
          setConversationState({ flow: "initial" });
        }
        return;
      }

      // ⑤ exam-professor: 교수 선택 후 최종 시험 정보 조회
      if (conversationState.flow === "exam-professor") {
        try {
          const sections = await fetchJson(
            `/api/chat/exam-info?semester=${encodeURIComponent(
              conversationState.selectedSemester
            )}&grade=${encodeURIComponent(
              conversationState.selectedGrade
            )}&subject=${encodeURIComponent(
              conversationState.selectedSubject
            )}&professor=${encodeURIComponent(option)}`
          );
          if (sections) {
            let response = `📘 ${conversationState.selectedSubject} (${option}) 시험 일정\n\n`;
            Object.entries(sections).forEach(([section, details]) => {
              response += `• ${section}\n  - 일시: ${details.date ?? "미정"} ${
                details.time ?? ""
              }\n  - 강의실: ${details.room ?? "미정"}\n`;
              if (details.note) {
                response += `  - 추가정보: ${details.note}\n`;
              }
              response += `\n`;
            });
            addMessage("bot", response);
          } else {
            addMessage("bot", "해당 수업의 시험 일정이 없습니다. 😢");
          }
        } catch (e) {
          addMessage("bot", `시험 일정 조회 실패: ${e.message}`);
        } finally {
          setTimeout(() => {
            addMessage("bot", "다른 서비스를 이용하시겠습니까?", ["처음으로"]);
          }, 1000);
          setConversationState({ flow: "initial" });
        }
        return;
      }

      // ⑥ 장학금 흐름 - 봉사 여부 단계
      if (conversationState.flow === "scholarship-volunteer") {
        const volunteer = option === "예";
        try {
          const eligible = await fetchJson("/api/chat/scholarship", {
            method: "POST",
            body: JSON.stringify({ gpa: pendingGPA, volunteer }),
          });
          if (!Array.isArray(eligible) || eligible.length === 0) {
            addMessage(
              "bot",
              `입력하신 평점(${pendingGPA})과 조건으로는 수혜 가능한 장학금이 없습니다. 😢`
            );
          } else {
            let msg = "🎓 신청 가능한 장학금 목록:\n\n";
            eligible.forEach((s) => {
              msg += `• ${s.name}\n  - 지원금액: ${s.amount}\n  - 조건: ${s.description}\n\n`;
            });
            addMessage("bot", msg);
          }
        } catch (e) {
          const errs = e?.data?.errors;
          if (errs?.length) {
            addMessage(
              "bot",
              `요청이 올바르지 않습니다:\n- ${errs
                .map((x) => `${x.field}: ${x.error}`)
                .join("\n- ")}`
            );
          } else {
            addMessage("bot", `장학금 조회 실패: ${e.message}`);
          }
        } finally {
          setTimeout(() => {
            addMessage("bot", "다른 서비스를 이용하시겠습니까?", ["처음으로"]);
          }, 1000);
          setConversationState({ flow: "initial" });
          setPendingGPA(null);
        }
        return;
      }
    }, 400);
  };

  // GPA 입력 폼 submit
  const handleInputSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    addMessage("user", inputValue);

    const trimmed = inputValue.trim();
    setInputValue("");

    if (conversationState.flow === "scholarship") {
      const gpa = parseFloat(trimmed);

      if (isNaN(gpa) || gpa < 0 || gpa > 4.5) {
        addMessage("bot", "올바른 평점을 입력해주세요. (0.0 ~ 4.5)", [], "gpa");
        return;
      }

      setPendingGPA(gpa);
      setConversationState({ flow: "scholarship-volunteer" });

      addMessage("bot", "사회봉사 시간을 이수하셨나요?", ["예", "아니오"]);
      return;
    }
  };

  const handleLinkClick = (link) => window.open(link, "_blank");

  // 🧩 렌더링
  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <MessageCircle className="icon" />
        <div>
          <div className="title">HI-Chat</div>
        </div>
      </div>

      <div className="chat-area">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message-row ${msg.type === "user" ? "user" : "bot"}`}
          >
            <div
              className={`message-bubble ${
                msg.type === "user" ? "user-bubble" : "bot-bubble"
              }`}
            >
              <div className="message-text">{msg.content}</div>

              {msg.options && (
                <div className="options">
                  {msg.options.map((opt, i) => (
                    <button
                      key={i}
                      className="option-btn"
                      onClick={() =>
                        msg.link
                          ? handleLinkClick(msg.link)
                          : handleOptionClick(opt)
                      }
                    >
                      {opt}
                      {msg.link && <ExternalLink size={12} />}
                    </button>
                  ))}
                </div>
              )}

              {msg.inputType && (
                <form onSubmit={handleInputSubmit} className="input-area">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="예: 3.75"
                  />
                  <button type="submit" className="send-btn">
                    <Send size={14} />
                  </button>
                </form>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="message-row bot">
            <div className="message-bubble bot-bubble">
              <div className="message-text">입력 중…</div>
            </div>
          </div>
        )}
      </div>

      <form className="chat-composer" onSubmit={handleComposerSubmit}>
        <input
          type="text"
          value={composerValue}
          onChange={(e) => setComposerValue(e.target.value)}
          placeholder="무엇을 도와드릴까요? 예: '운영체제 중간고사 언제야?'"
        />
        <button type="submit" className="send-btn">
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}

export default ChatBot;
