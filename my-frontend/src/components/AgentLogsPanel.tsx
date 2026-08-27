import React, { useEffect, useRef } from "react";

type AgentLog = {
  timestamp: string;
  step: string;
  message: string;
  level?: string;
};

type Props = {
  logs: AgentLog[];
};

export function AgentLogsPanel({ logs }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const getCardStyle = (level?: string): React.CSSProperties => {
    switch (level) {
      case "error":
        return {
          border: "1px solid #fecaca",
          background: "#fff1f2",
        };
      case "warning":
        return {
          border: "1px solid #fde68a",
          background: "#fffbeb",
        };
      case "success":
        return {
          border: "1px solid #bbf7d0",
          background: "#f0fdf4",
        };
      default:
        return {
          border: "1px solid #dbeafe",
          background: "#f8fbff",
        };
    }
  };

  const getMessageColor = (level?: string): string => {
    switch (level) {
      case "error":
        return "#b91c1c";
      case "warning":
        return "#b45309";
      case "success":
        return "#047857";
      default:
        return "#0f172a";
    }
  };

  const getBadgeStyle = (level?: string): React.CSSProperties => {
    switch (level) {
      case "error":
        return {
          background: "#fee2e2",
          color: "#b91c1c",
        };
      case "warning":
        return {
          background: "#fef3c7",
          color: "#b45309",
        };
      case "success":
        return {
          background: "#dcfce7",
          color: "#047857",
        };
      default:
        return {
          background: "#e0f2fe",
          color: "#0369a1",
        };
    }
  };

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          minHeight: 0,
          paddingRight: 4,
        }}
      >
        {logs.length === 0 ? (
          <div
            style={{
              border: "1px dashed #bfdbfe",
              background: "linear-gradient(180deg, #f8fbff 0%, #eff6ff 100%)",
              borderRadius: 18,
              padding: 24,
              color: "#64748b",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#3b82f6",
                marginBottom: 10,
              }}
            >
              No activity yet
            </div>

            <div
              style={{
                fontSize: 15,
                lineHeight: 1.7,
              }}
            >
              Agent logs will appear here after you send your first question.
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {logs.map((log, i) => (
              <div
                key={`${log.timestamp}-${i}`}
                style={{
                  ...getCardStyle(log.level),
                  borderRadius: 18,
                  padding: 16,
                  boxShadow: "0 6px 18px rgba(59, 130, 246, 0.06)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                    marginBottom: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: "#0f172a",
                        marginBottom: 4,
                        textTransform: "capitalize",
                      }}
                    >
                      {log.step}
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                      }}
                    >
                      {log.timestamp}
                    </div>
                  </div>

                  <div
                    style={{
                      ...getBadgeStyle(log.level),
                      borderRadius: 999,
                      padding: "6px 10px",
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {log.level || "info"}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 14,
                    lineHeight: 1.7,
                    color: getMessageColor(log.level),
                  }}
                >
                  {log.message}
                </div>
              </div>
            ))}

            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  );
}
