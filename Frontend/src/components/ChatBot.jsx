import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, ExternalLink } from "lucide-react";
import "./ChatBot.css";

/**
 * =============================================================
 * HI-Chat (홍익대학교 학사 정보 챗봇) — 주석 가이드
 * =============================================================
 * 이 컴포넌트는 "버튼 기반 대화 플로우"와 "자연어 입력(NLP) 라우팅"을
 * 함께 제공하는 간단한 챗봇 UI입니다.
 *
 * 핵심 아이디어
 * 1) 상태 머신처럼 flow 단계를 나눠서( initial → exam-semester → exam-grade → ... )
 *    버튼 클릭과 API 응답에 따라 다음 단계로 넘어갑니다.
 * 2) 화면 하단의 자유 입력창(Composer)에 사용자가 자연어로 질문하면
 *    NLP(실제 Watson 또는 가짜 로직)가 의도를 파악하여 적절한 버튼 플로우로 연결합니다.
 * 3) 서버 API는 동일한 엔드포인트 규칙(`/api/chat/*`)을 사용하며,
 *    fetchJson 헬퍼로 에러 처리와 JSON 파싱을 통일합니다.
 *
 * 이 파일을 처음 보는 분들을 위한 읽는 순서
 * - 환경/상수 설정 → 공용 헬퍼(fetchJson) → 컴포넌트 상태들 → NLP 관련 함수 →
 *   엔티티를 상태에 반영 → 핸들러들(자연어/버튼/입력) → 렌더 구성을 보시면 이해가 쉽습니다.
 */

// ====== 백엔드 API 베이스 URL (Vite 환경변수에서 주입) ======
const API_BASE = import.meta.env.VITE_API_BASE_URL;

// ====== NLP 설정 ======
// NLP_BASE: 실제 Watson(또는 프록시) 서버의 베이스 경로
// USE_FAKE_NLP: 초기 개발 단계에서 백엔드 없이도 동작하도록
//               간단한 키워드 매칭으로 의도를 흉내내는 스위치
const NLP_BASE = `${API_BASE}/api/nlp`;
const USE_FAKE_NLP = true; // 백엔드 준비 전엔 true로 두고 테스트

// Watson 인텐트 → 기존 버튼 라벨 매핑
// NLP가 "exam_schedule"을 잡아내면, 기존 버튼 플로우의 "시험 일정 조회"로 보냅니다.
const intentMap = {
  exam_schedule: "시험 일정 조회",
  academic_calendar: "학사 일정 확인",
  grade_result_date: "성적 확인 일정",
  scholarship_info: "장학금 안내",
};

/** 공통 JSON 요청 헬퍼
 * - 모든 API 요청을 이 함수로 통일하면, 에러 처리와 파싱 로직이 한 곳에 모입니다.
 * - 응답 본문이 비어 있어도 안전하게 처리합니다.
 */
async function fetchJson(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = new Error(data?.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function ChatBot() {
  // ========================= 대화 메시지 상태 =========================
  // messages: 채팅 창에 줄줄이 렌더링되는 데이터.
  //  - type: 'bot' | 'user'
  //  - content: 말풍선에 표시할 텍스트
  //  - options: 선택지 버튼 목록(배열)
  //  - inputType: 이 말풍선 아래에 표시할 입력창 타입(예: 'gpa')
  //  - link: 버튼 클릭 시 외부 페이지로 이동시키고 싶을 때 사용
  const [messages, setMessages] = useState([
    {
      id: "1",
      type: "bot",
      content:
        "안녕하세요! 홍익대학교 학사 정보 챗봇입니다. 🤓\n\n원하시는 서비스를 선택해주세요.",
      options: [
        "시험 일정 조회",
        "학사 일정 확인",
        "성적 확인 일정",
        "장학금 안내",
      ],
    },
  ]);

  // ========================= 대화 흐름(상태 머신) =========================
  // flow: 현재 단계 (initial → exam-semester → exam-grade → exam-subject → exam-professor → ...)
  // selected* : 각 단계에서 사용자가 고른 값들을 보관하여 다음 API 호출의 쿼리로 사용
  const [conversationState, setConversationState] = useState({
    flow: "initial",
    selectedSemester: "",
    selectedGrade: "",
    selectedSubject: "",
    selectedProfessor: "",
  });

  // 버튼 말풍선 아래에 붙는 입력창용 값 (예: GPA 입력)
  const [inputValue, setInputValue] = useState("");
  const [pendingGPA, setPendingGPA] = useState(null); // 장학금 시나리오에서 입력받은 GPA 임시 저장

  // ========================= 자유 입력(NLP) 전용 상태 =========================
  // composerValue: 하단 고정 입력창(자연어 질문) 값
  // isTyping: "입력 중…" 인디케이터
  // sessionIdRef: 실제 Watson 모드에서 세션 ID를 유지(useRef는 렌더 사이클 간 값 보존)
  const [composerValue, setComposerValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const sessionIdRef = useRef(null);

  // 실제 Watson 모드일 때만 세션 생성
  useEffect(() => {
    if (!USE_FAKE_NLP) {
      (async () => {
        try {
          const r = await fetch(`${NLP_BASE}/session`);
          const j = await r.json();
          sessionIdRef.current = j.session_id; // 이후 메시지 전송 시 함께 사용
        } catch (e) {
          addMessage("bot", "NLP 세션 초기화 실패: 새로고침해 주세요.");
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 말풍선 하나를 messages에 추가하는 헬퍼 */
  const addMessage = (type, content, options, inputType, link) => {
    const newMessage = {
      id: Date.now().toString(), // 간단히 타임스탬프로 유니크 ID 생성
      type,
      content,
      options,
      inputType,
      link,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  // ========================= NLP 전송 함수들 =========================
  // 실제(Real) Watson: 세션과 함께 서버에 메시지 전송
  async function sendRealNLP(text, context) {
    const r = await fetch(`${NLP_BASE}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionIdRef.current, text, context }),
    });
    if (!r.ok) throw new Error(`NLP HTTP ${r.status}`);
    return r.json(); // 예: { output: { intents, entities, generic, ... } }
  }

  // 가짜(Fake) NLP: 아주 단순한 키워드 매칭으로 의도 흉내
  async function sendFakeNLP(text) {
    const t = text.toLowerCase();
    let intent = null;
    if (t.includes("시험") || t.includes("중간") || t.includes("기말"))
      intent = "exam_schedule";
    else if (t.includes("학사")) intent = "academic_calendar";
    else if (t.includes("성적") || t.includes("열람"))
      intent = "grade_result_date";
    else if (t.includes("장학")) intent = "scholarship_info";

    return {
      output: {
        intents: intent ? [{ intent, confidence: 0.9 }] : [],
        entities: [],
        generic: intent
          ? [{ text: "요청을 이해했어요. 관련 메뉴로 이동합니다." }]
          : [],
      },
    };
  }

  // 실제/가짜 중 스위치에 따라 전송
  async function sendNLPorMock(text, context) {
    if (USE_FAKE_NLP) return sendFakeNLP(text);
    return sendRealNLP(text, context);
  }

  // ========================= Watson 엔티티 → 우리 상태에 반영 =========================
  // Watson에서 추출한 엔티티(semester/grade/subject/professor 등)가 있다면
  // 이후 단계에서 선택 과정을 건너뛰거나 기본값으로 활용할 수 있습니다.
  function applyEntitiesToState(entities) {
    const getVal = (name) => entities.find((e) => e.entity === name)?.value;

    const semester = getVal("semester"); // 예: "2025-2학기 중간고사"
    const grade = getVal("grade"); // 예: "2학년"
    const subject = getVal("subject"); // 예: "자료구조및프로그래밍"
    const professor = getVal("professor"); // 예: "송하윤 교수"

    setConversationState((prev) => ({
      ...prev,
      selectedSemester: semester ?? prev.selectedSemester,
      selectedGrade: grade ?? prev.selectedGrade,
      selectedSubject: subject ?? prev.selectedSubject,
      selectedProfessor: professor ?? prev.selectedProfessor,
    }));
  }

  // ========================= 자유 입력창(Composer) 제출 핸들러 =========================
  // * 초기 화면(flow === 'initial')에서만 NLP로 라우팅합니다.
  // * 의도가 애매하면 기본 버튼 선택지로 유도합니다.
  const handleComposerSubmit = async (e) => {
    e.preventDefault();
    const text = composerValue.trim();
    if (!text) return;

    addMessage("user", text);
    setComposerValue("");

    if (conversationState.flow !== "initial") return; // 진행 중인 플로우가 있으면 방해하지 않음

    try {
      setIsTyping(true);
      const data = await sendNLPorMock(text);

      // Watson이 생성한 자연어 답변(generic)이 있으면 먼저 보여주기
      const generic = (data.output?.generic || [])
        .map((g) => g.text)
        .filter(Boolean);
      if (generic.length) addMessage("bot", generic.join("\n"));

      // 엔티티가 있다면 내부 상태에 반영(슬롯 채우기)
      applyEntitiesToState(data.output?.entities || []);

      // 최상위 의도 + 신뢰도를 이용해 기존 버튼 플로우로 매핑
      const top = data.output?.intents?.[0];
      const minConfidence = 0.45;
      const mapped = top?.intent && intentMap[top.intent];

      if (!top || top.confidence < minConfidence || !mapped) {
        // 애매하면 기본 메뉴로 유도
        addMessage("bot", "아래에서 원하시는 서비스를 선택해주세요.", [
          "시험 일정 조회",
          "학사 일정 확인",
          "성적 확인 일정",
          "장학금 안내",
        ]);
        return;
      }

      // 의도가 확실하면 해당 버튼을 누른 것처럼 행동
      await handleOptionClick(mapped);
    } catch (err) {
      addMessage("bot", `NLP 오류: ${err.message}`);
    } finally {
      setIsTyping(false);
    }
  };

  // ========================= 버튼(옵션) 클릭 핸들러 =========================
  // 한 함수가 모든 단계(flow)를 스위치처럼 처리합니다.
  // setTimeout(400ms)은 "생각하는 느낌"을 주기 위한 연출(실제 기능엔 영향 없음)
  const handleOptionClick = async (option) => {
    addMessage("user", option);

    setTimeout(async () => {
      // ① 초기 메뉴 선택
      if (conversationState.flow === "initial") {
        switch (option) {
          case "시험 일정 조회": {
            // 다음 단계로: 학기/시험 종류 선택
            setConversationState({ flow: "exam-semester" });
            addMessage("bot", "조회하실 학기와 시험을 선택해주세요.", [
              "2025-1학기 중간고사",
              "2025-1학기 기말고사",
              "2025-2학기 중간고사",
              "2025-2학기 기말고사",
            ]);
            return;
          }

          case "학사 일정 확인": {
            // 외부 링크로 유도 → 버튼을 누르면 handleLinkClick으로 새 탭 오픈
            addMessage(
              "bot",
              "홍익대학교 공식 학사 일정 페이지로 이동합니다.\n\n아래 버튼을 클릭하여 최신 학사 일정을 확인하세요.",
              ["홍익대학교 학사 일정 페이지"],
              undefined,
              "https://www.hongik.ac.kr/index.do"
            );
            setTimeout(() => {
              addMessage("bot", "다른 서비스를 이용하시겠습니까?", [
                "처음으로",
              ]);
            }, 1000);
            return;
          }

          case "성적 확인 일정": {
            // 서버에서 이번 학기의 성적 열람 시작일 정보를 받아와 안내
            try {
              const gradeResult = await fetchJson(
                "/api/chat/grade-result-date"
              );
              addMessage(
                "bot",
                `📅 성적 확인 일정 안내\n\n• 학기: ${gradeResult.semester}\n• 성적 열람 시작일: ${gradeResult.date}\n• 시작 시간: ${gradeResult.time}\n\n학사정보시스템을 통해 확인하실 수 있습니다.`
              );
            } catch (e) {
              addMessage("bot", `성적 일정 조회 실패: ${e.message}`);
            }
            setTimeout(() => {
              addMessage("bot", "다른 서비스를 이용하시겠습니까?", [
                "처음으로",
              ]);
            }, 1000);
            return;
          }

          case "장학금 안내": {
            // 장학금은 조건(예: GPA, 봉사 여부)에 따라 달라지므로 입력을 받습니다.
            setConversationState({ flow: "scholarship" });
            addMessage(
              "bot",
              "교내 장학금 수혜 가능 여부를 확인해드리겠습니다.\n\n본인의 평점을 입력해주세요. (예: 3.75)",
              [],
              "gpa" // 이 말풍선 아래에 소형 입력창을 노출
            );
            return;
          }

          case "처음으로": {
            // 언제든 초기 메뉴로 리셋 가능
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

      // ② 학기/시험 선택 → 다음은 학년 선택 단계
      if (conversationState.flow === "exam-semester") {
        setConversationState({
          ...conversationState,
          flow: "exam-grade",
          selectedSemester: option, // 사용자가 고른 학기/시험(문자열) 저장
        });
        addMessage("bot", "조회하실 학년을 선택해주세요.", [
          "1학년",
          "2학년",
          "3학년",
          "4학년",
        ]);
        return;
      }

      // ③ 학년 선택 → 과목 목록 API 호출
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

      // ④ 과목 선택 → 교수 목록 API 호출
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

      // ⑤ 교수 선택 → 섹션별 시험 일정 출력
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
          setConversationState({ flow: "initial" }); // 플로우 종료 후 초기화
        }
        return;
      }

      // ⑥ 장학금 흐름 중 봉사 여부 선택 단계
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

  // ========================= 말풍선 하단 입력창 제출(GPA 등) =========================
  const handleInputSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    addMessage("user", inputValue);
    const trimmed = inputValue.trim();
    setInputValue("");

    if (conversationState.flow === "scholarship") {
      const gpa = parseFloat(trimmed);
      if (isNaN(gpa) || gpa < 0 || gpa > 4.5) {
        // 유효성 검사 실패 시, 같은 말풍선에 입력창을 다시 노출
        addMessage("bot", "올바른 평점을 입력해주세요. (0.0 ~ 4.5)", [], "gpa");
        return;
      }
      // GPA 저장 후 봉사 여부 질문 단계로 이동
      setPendingGPA(gpa);
      setConversationState({ flow: "scholarship-volunteer" });
      addMessage("bot", "사회봉사 시간을 이수하셨나요?", ["예", "아니오"]);
      return;
    }
  };

  // 외부 링크 버튼용 클릭 핸들러
  const handleLinkClick = (link) => window.open(link, "_blank");

  // ========================= 렌더 =========================
  // 상단 헤더 → 대화 말풍선 목록 → (타이핑 표시) → 하단 자유 입력창(Composer)
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
              {/* 텍스트 본문 */}
              <div className="message-text">{msg.content}</div>

              {/* 선택지 버튼(있을 때만) */}
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

              {/* 말풍선 하단 입력창(예: GPA) */}
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

        {/* NLP 처리 중 시각적 피드백 */}
        {isTyping && (
          <div className="message-row bot">
            <div className="message-bubble bot-bubble">
              <div className="message-text">입력 중…</div>
            </div>
          </div>
        )}
      </div>

      {/* 항상 보이는 자유 입력창(자연어 질문) */}
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
