import React, { useState } from "react";

type Props = {
  onSend: (message: string) => void;
  disabled?: boolean;
};

export function ChatInputPanel({ onSend, disabled = false }: Props) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      <div>
        <h2
          style={{
            margin: 0,
            fontSize: 22,
            lineHeight: 1.2,
            fontWeight: 800,
            color: "#0f172a",
          }}
        >
          Your question
        </h2>

        <p
          style={{
            marginTop: 10,
            marginBottom: 0,
            fontSize: 14,
            lineHeight: 1.6,
            color: "#475569",
          }}
        >
          Ask about employees, salaries, departments, rankings, or other HR data
          in natural language.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <label
          htmlFor="user-question"
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#2563eb",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Question input
        </label>

        <textarea
          id="user-question"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Example: Show the 5 highest-paid employees with their department and annual salary."
          style={{
            width: "100%",
            minHeight: 220,
            resize: "vertical",
            borderRadius: 18,
            border: "1px solid #bfdbfe",
            background: disabled ? "#eff6ff" : "#f8fbff",
            padding: "16px 18px",
            fontSize: 15,
            lineHeight: 1.6,
            color: "#0f172a",
            outline: "none",
            boxSizing: "border-box",
            boxShadow: disabled
              ? "none"
              : "inset 0 1px 2px rgba(15, 23, 42, 0.03)",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#64748b",
              lineHeight: 1.5,
            }}
          >
            Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong>{" "}
            for a new line.
          </div>

          <button
            onClick={handleSend}
            disabled={disabled || !message.trim()}
            style={{
              border: "none",
              borderRadius: 14,
              background:
                disabled || !message.trim()
                  ? "#bfdbfe"
                  : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              color: "white",
              padding: "12px 18px",
              fontSize: 14,
              fontWeight: 700,
              cursor: disabled || !message.trim() ? "not-allowed" : "pointer",
              boxShadow:
                disabled || !message.trim()
                  ? "none"
                  : "0 10px 20px rgba(37, 99, 235, 0.25)",
              transition: "all 0.2s ease",
              minWidth: 110,
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
