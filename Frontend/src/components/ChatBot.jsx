import { useState } from "react";
import { MessageCircle, Send, ExternalLink } from "lucide-react";
import "./ChatBot.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// NLP가 의도를 추출 -> 첫화면의 메뉴들 중 특정 메뉴(버튼)으로 자동적으로 연결할 수 있게 해주는 mapping표

const intentMap = {
  exam_schedule: "시험 일정 조회",
  academic_calendar: "학사 일정 확인",
  grade_result_date: "성적 확인 일정",
  scholarship_info: "장학금 안내",
};

// 사용자의 메시지에서 학년 / 학기 / 과목명을 간단히 추출하는 규칙 기반 엔티티 처리기
function extractEntities(text) {
  const entities = [];
  const t = text.toLowerCase();

  // 1) 학년
  if (t.includes("1학년")) entities.push({ entity: "grade", value: "1학년" });
  if (t.includes("2학년")) entities.push({ entity: "grade", value: "2학년" });
  if (t.includes("3학년")) entities.push({ entity: "grade", value: "3학년" });
  if (t.includes("4학년")) entities.push({ entity: "grade", value: "4학년" });

  // 2) 학기: 예) "2025-2학기", "2024-1학기"
  const semesterRegex = /(202[0-9]-[12]학기)/;
  const sem = text.match(semesterRegex);
  if (sem) {
    entities.push({ entity: "semester", value: sem[1] });
  }

  // 3) 간단한 과목명 추출 (원하면 여기에 과목 추가 가능)
  const subjects = ["자료구조", "운영체제", "데이터베이스", "컴퓨터구조"];
  subjects.forEach((sub) => {
    if (t.includes(sub)) {
      entities.push({ entity: "subject", value: sub });
    }
  });

  return entities;
}

// 백엔드로 요청을 보내고 응답을 확인

async function fetchJson(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    // 1. 백엔드로 요청을 보냄
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  // 2. JSON 파싱을 통일

  const text = await res.text(); // 백엔드의 응답을 text로 받음
  const data = text ? JSON.parse(text) : null; // 응답의 길이 > 0 -> 파싱  , 응답이 비어있으면 null 반환

  if (!res.ok) {
    // 에러 처리
    const err = new Error(data?.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function ChatBot() {
  const [messages, setMessages] = useState([
    // 말풍선의 message 관리 , 화면에 보이는 말풍선 목록

    // 첫화면의 메세지 구조
    {
      id: "1", // 메세지 구분을 위함
      type: "bot", // 챗봇이 대화를 시작
      // 말풍선 속 들어갈 대화 내용
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

  // 대화 흐름 관리

  /**
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

  const [inputValue, setInputValue] = useState("");
  const [pendingGPA, setPendingGPA] = useState(null); // 받을 수 있는 장학금을 알아보기 위해 받는 장학금 입력값

  // 자유 입력창과 관련된 value들

  const [composerValue, setComposerValue] = useState("");
  // composerValue는 추후 handleComposerSubmit함수에서 intent를 분석하고 분석된 값에 따라 버튼 플로우로 라우팅해주는데 쓰임

  const [isTyping, setIsTyping] = useState(false);

  // 말풍선 추가해주는 함수

  const addMessage = (type, content, options, inputType, link) => {
    const newMessage = {
      id: Date.now().toString(), // 현재 시각을 기준으로 unique 한 id를 생성
      type, // bot 인지 사용자인지
      content, // 말풍선에 들어갈 내용
      options, // 말풍선에 들어갈 버튼 목록
      inputType, // 말풍선에 들어갈 입력창(gpa)
      link, // 외부 url(학사 일정 홈페이지로 연결 )
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  // ========================= Fake NLP =========================
  async function semiNLP(text) {
    const t = text.toLowerCase(); // 사용자로부터 입력받은 메세지를 소문자화시킴

    let intent = null; // null값으로 먼저 intent를 초기화

    // 키워드 매칭하기

    if (t.includes("시험") || t.includes("중간") || t.includes("기말"))
      intent = "exam_schedule";
    // 시험 일정 키워드가 있을 경우 intent를 "exam_schedule"로 매핑
    else if (t.includes("학사") || t.includes("학사일정"))
      intent = "academic_calendar";
    // 학사 일정 관련 키워드 : intent - > "academic_calender"로 매핑
    else if (t.includes("성적") || t.includes("열람"))
      // 성적 열람 관련 키워드는 "grade_result_date"로 intent를 매핑
      intent = "grade_result_date";
    else if (t.includes("장학")) intent = "scholarship_info"; // 장학금 관련은 "scholarship_info"로 intent를 매핑

    const entities = extractEntities(text);

    return {
      output: {
        intents: intent ? [{ intent, confidence: 0.9 }] : [],
        entities, // <- semi 엔티티가 여기에 담김
        generic: intent
          ? [{ text: "요청을 이해했어요. 관련 메뉴로 이동합니다." }]
          : [],
      },
    };
  }

  // nlp가 뽑은 엔티티를 챗봇의 내부 상태에 저장하는 함수 - 현재 semiNLP 상태에서는 작용 x

  function applyEntitiesToState(entities) {
    //getVal :  entities에 들어있는 여러가지 정보 중에 특정 정보만 뽑아낼 수 있게 함
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

  // 사용자 입력창에 message 입력

  const handleComposerSubmit = async (e) => {
    e.preventDefault();

    const text = composerValue.trim();

    if (!text) return; // text 없으면 함수 종료

    addMessage("user", text); // 사용자가 입력한 텍스트를 채팅창에 사용자의 말풍선으로 추가 (화면에 표시)

    setComposerValue(""); // 입력창 비우기

    if (conversationState.flow !== "initial") return; // 초기 화면이 아닐경우 NLP로 해석x
    // 버튼으로 이미 플로우가 진행 중이면 자연어 입력이 플로우를 방해하지 않도록 함

    try {
      setIsTyping(true);

      const data = await semiNLP(text);

      const generic = (data.output?.generic || []) // 챗봇이 바로 말할 수 있는 문장들 가져옴
        .map((g) => g.text) // 객체 배열에서 text 만 가져오기
        .filter(Boolean); // 빈 문자열 혹은 null undefined는 제거

      if (generic.length) addMessage("bot", generic.join("\n")); // generic의 텍스트가 있으면 봇 말풍선 추가

      applyEntitiesToState(data.output?.entities || []); // NLPrㅏ 뽑아준 엔티티가 있으면 conversationstate에 반영(semiNLP에서는 작동 x)

      const top = data.output?.intents?.[0]; // 가장 신뢰도가 높은 intent 가져옴
      const minConfidence = 0.45; // 최소 신뢰도 : 0.45 (watson 기준 따름 )
      const mapped = top?.intent && intentMap[top.intent]; // intentMap 기준으로 버튼 플로우로 연결

      if (!top || top.confidence < minConfidence || !mapped) {
        // 사용자의 입력의 intent를 잘 파악하지 못하면 아래의 메세지를 챗봇이 내보냄
        addMessage("bot", "아래에서 원하시는 서비스를 선택해주세요.", [
          "시험 일정 조회",
          "학사 일정 확인",
          "성적 확인 일정",
          "장학금 안내",
        ]);
        return;
      }

      await handleOptionClick(mapped); // intent와 버튼이 잘 매핑이 되었음
    } catch (err) {
      addMessage("bot", `NLP 오류: ${err.message}`);
    } finally {
      setIsTyping(false);
    }
  };

  // 사용자가 메뉴 버튼 클릭 시 실행되는 handleOptionClick
  const handleOptionClick = async (option) => {
    addMessage("user", option);
    // 사용자가 클릭한 버튼을 user쪽 말풍선으로 채팅창에 표시

    setTimeout(async () => {
      // ① 초기 메뉴 단계
      if (conversationState.flow === "initial") {
        // 사용자가 누른 버튼에 따라 분기
        switch (option) {
          // 사용자 누른 버튼 : 시험 일정 조회 일 때
          case "시험 일정 조회": {
            setConversationState({ flow: "exam-semester" }); // flow 변경
            addMessage("bot", "조회하실 학기와 시험을 선택해주세요.", [
              "2025-1학기 중간고사",
              "2025-1학기 기말고사",
              "2025-2학기 중간고사",
              "2025-2학기 기말고사",
            ]);
            return;
          }
          // 사용자 누른 버튼 : 학사 일정 확인일 때
          case "학사 일정 확인": {
            addMessage(
              "bot",
              "홍익대학교 공식 학사 일정 페이지로 이동합니다.\n\n아래 버튼을 클릭하여 최신 학사 일정을 확인하세요.",
              ["홍익대학교 학사 일정 페이지"],
              undefined,
              "https://www.hongik.ac.kr/kr/education/academic-schedule.do"
            );
            setTimeout(() => {
              addMessage("bot", "다른 서비스를 이용하시겠습니까?", [
                "처음으로",
              ]);
            }, 1000);
            return;
          }
            case "성적 확인 일정": {
                try {
                    // 1. gradeResults (복수) 는 이제 *배열*입니다.
                    const gradeResults = await fetchJson(
                        "/api/chat/grade-result-date"
                    );

                    // 2. 배열이 비어있거나, 데이터가 없는지 확인
                    if (!Array.isArray(gradeResults) || gradeResults.length === 0) {
                        addMessage("bot", "성적 확인 일정이 아직 등록되지 않았습니다.");
                    } else {
                        // 3. 배열을 순회하며(loop) 메시지 텍스트를 만듭니다.
                        let messageContent = "📅 성적 확인 일정 안내\n";
                        gradeResults.forEach((result) => {
                            messageContent += `\n• 학기: ${result.semester}\n• 성적 열람 시작일: ${result.date}\n• 시작 시간: ${result.time}\n`;
                        });
                        messageContent += "\n학사정보시스템을 통해 확인하실 수 있습니다.";

                        addMessage("bot", messageContent);
                    }

                } catch (e) {
                    addMessage("bot", `성적 일정 조회 실패: ${e.message}`);
                }

                // 4. (★★★★★) "처음으로" 버튼을 추가하는 setTimeout을 다시 넣습니다.
                setTimeout(() => {
                    addMessage("bot", "다른 서비스를 이용하시겠습니까?", [
                        "처음으로",
                    ]);
                }, 1000); // 1초 뒤에 "처음으로" 버튼 표시

                // 5. (★★★★★) return을 사용해 'initial' flow를 종료합니다.
                return;
            }
          // 사용자 누른 버튼 : 장학금 안내일 때
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
            setConversationState({ flow: "initial" });
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
        }
      }

      // ② 현재 flow의 상태가 exam-semester인 경우 ->  학년 선택 단계로
      if (conversationState.flow === "exam-semester") {
        setConversationState({
          ...conversationState,
          flow: "exam-grade",
          selectedSemester: option,
        });
        addMessage("bot", "조회하실 학년을 선택해주세요.", [
          "1학년",
          "2학년",
          "3학년",
          "4학년",
        ]);
        return;
      }

      // ③ 학년 선택 후 과목 목록 조회
      if (conversationState.flow === "exam-grade") {
        try {
          const subjects = await fetchJson(
            `/api/chat/subjects?semester=${encodeURIComponent(
              conversationState.selectedSemester
            )}&grade=${encodeURIComponent(option)}`
          );
          if (subjects.length > 0) {
            setConversationState({
              ...conversationState,
              flow: "exam-subject",
              selectedGrade: option,
            });
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

      // ④ 과목 선택 후 교수 목록 조회
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
            setConversationState({
              ...conversationState,
              flow: "exam-professor",
              selectedSubject: option,
            });
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

      // ⑤ 교수 선택 후 시험 정보 조회
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

  //말풍선 속 입력을 처리하는 함수 (gpa)

  const handleInputSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    addMessage("user", inputValue);

    const trimmed = inputValue.trim();

    setInputValue(""); // 입력 창 비우기

    if (conversationState.flow === "scholarship") {
      // 장학금 입력 중일 때

      const gpa = parseFloat(trimmed);

      if (isNaN(gpa) || gpa < 0 || gpa > 4.5) {
        // 올바른 입력이 아닐 때
        addMessage("bot", "올바른 평점을 입력해주세요. (0.0 ~ 4.5)", [], "gpa");
        return;
      }

      setPendingGPA(gpa);

      setConversationState({ flow: "scholarship-volunteer" }); // 제대로된 학점이 입력되었을 때 현재 대화 상태를 사회 봉사 이수를 묻는 단계로 이동

      addMessage("bot", "사회봉사 시간을 이수하셨나요?", ["예", "아니오"]);
      // 사회 봉사 시간 이수를 봇이 물어보는 채팅을 띄움

      return;
    }
  };

  const handleLinkClick = (link) => window.open(link, "_blank");

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        {/* 챗봇 상단바  */}
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
          placeholder="무엇을 도와드릴까요? 예: '2학년 자료구조 중간 언제야?'"
        />
        <button type="submit" className="send-btn">
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}

export default ChatBot;
