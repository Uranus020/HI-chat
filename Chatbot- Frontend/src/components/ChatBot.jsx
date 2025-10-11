import { useState } from "react";
import { MessageCircle, Send, ExternalLink } from "lucide-react";
import "./ChatBot.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

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

  const [conversationState, setConversationState] = useState({
    flow: "initial",
    selectedSemester: "",
    selectedGrade: "",
    selectedSubject: "",
    selectedProfessor: "",
  });

  const [inputValue, setInputValue] = useState("");
  const [pendingGPA, setPendingGPA] = useState(null);

  const addMessage = (type, content, options, inputType, link) => {
    const newMessage = {
      id: Date.now().toString(),
      type,
      content,
      options,
      inputType,
      link,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleOptionClick = async (option) => {
    addMessage("user", option);

    setTimeout(async () => {
      // ① 초기 메뉴 선택
      if (conversationState.flow === "initial") {
        switch (option) {
          case "시험 일정 조회": {
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

      // ② 학기 선택
      if (conversationState.flow === "exam-semester") {
        setConversationState({
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

      // ③ 학년 선택 → 과목
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

      // ④ 과목 선택 → 교수 선택
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

      // ⑤ 교수 선택 → 시험 일정 출력
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
              response += `• ${section}\n  - 일시: ${details.date} ${details.time}\n  - 강의실: ${details.room}\n\n`;
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

      // ⑥ 사회봉사 여부 처리 (장학금)
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
          // 검증 에러/서버 에러 친절히 표시
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
      // GPA 저장 후 봉사 여부 질문
      setPendingGPA(gpa);
      setConversationState({ flow: "scholarship-volunteer" });
      addMessage("bot", "사회봉사 시간을 이수하셨나요?", ["예", "아니오"]);
      return;
    }
  };

  const handleLinkClick = (link) => window.open(link, "_blank");

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
      </div>
    </div>
  );
}

export default ChatBot;
