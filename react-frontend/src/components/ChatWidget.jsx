import { useState, useRef, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi! I'm Sevika Assistant. Ask me anything about donations, organisations, or the platform!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("sevika_user") || "{}");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const res = await axios.post(`${API}/api/chat`, {
        message: userMsg,
        userId: user.id || null,
        role: user.role || null
      });
      setMessages(prev => [...prev, { role: "bot", text: res.data.answer }]);
    } catch {
      setMessages(prev => [...prev, { role: "bot", text: "Sorry, I'm unavailable right now. Please try again later." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 9999 }}>
      {/* Chat window */}
      {open && (
        <div style={{
          width: "340px",
          height: "480px",
          background: "white",
          borderRadius: "16px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          display: "flex",
          flexDirection: "column",
          marginBottom: "12px",
          overflow: "hidden",
          border: "1px solid #e5e7eb"
        }}>
          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #1e3a5f, #2d6a9f)",
            padding: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "18px"
              }}>🤝</div>
              <div>
                <div style={{ color: "white", fontWeight: "600", fontSize: "14px" }}>Sevika Assistant</div>
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "11px" }}>Powered by RAG + LLaMA 3</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{
              background: "none", border: "none", color: "white",
              fontSize: "20px", cursor: "pointer", lineHeight: 1
            }}>×</button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "16px",
            display: "flex", flexDirection: "column", gap: "10px",
            background: "#f9fafb"
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start"
              }}>
                <div style={{
                  maxWidth: "80%",
                  padding: "10px 14px",
                  borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: msg.role === "user" ? "#1e3a5f" : "white",
                  color: msg.role === "user" ? "white" : "#1f2937",
                  fontSize: "13px",
                  lineHeight: "1.5",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                  border: msg.role === "bot" ? "1px solid #e5e7eb" : "none"
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{
                  padding: "10px 14px", borderRadius: "16px 16px 16px 4px",
                  background: "white", border: "1px solid #e5e7eb",
                  fontSize: "13px", color: "#6b7280"
                }}>
                  Thinking...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: "12px", borderTop: "1px solid #e5e7eb",
            display: "flex", gap: "8px", background: "white"
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask me anything..."
              style={{
                flex: 1, padding: "10px 14px", borderRadius: "24px",
                border: "1px solid #d1d5db", fontSize: "13px",
                outline: "none", background: "#f9fafb"
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                width: "40px", height: "40px", borderRadius: "50%",
                background: "#1e3a5f", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                opacity: loading || !input.trim() ? 0.5 : 1
              }}
            >
              <span style={{ color: "white", fontSize: "16px" }}>➤</span>
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "56px", height: "56px", borderRadius: "50%",
          background: "linear-gradient(135deg, #1e3a5f, #2d6a9f)",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          fontSize: "24px"
        }}
      >
        {open ? "✕" : "🤝"}
      </button>
    </div>
  );
}