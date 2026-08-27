import React, { useState } from "react";
import { AgentLogsPanel } from "./AgentLogsPanel";

type AgentLog = {
  timestamp: string;
  step: string;
  message: string;
  level?: string;
};

type Props = {
  logs: AgentLog[];
};

export function LogsDrawer({ logs }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? "Close logs panel" : "Open logs panel"}
        title={open ? "Close logs" : "Open logs"}
        style={{
          position: "fixed",
          right: 0,
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 1001,
          border: "1px solid #bfdbfe",
          borderRight: "none",
          borderTopLeftRadius: 16,
          borderBottomLeftRadius: 16,
          background: "linear-gradient(180deg, #ffffff 0%, #eff6ff 100%)",
          padding: "14px 12px",
          cursor: "pointer",
          boxShadow: "0 8px 24px rgba(59, 130, 246, 0.16)",
          fontSize: 20,
          fontWeight: 700,
          color: "#2563eb",
          transition: "all 0.2s ease",
        }}
      >
        {open ? "→" : "←"}
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.18)",
            backdropFilter: "blur(2px)",
            zIndex: 999,
          }}
        />
      )}

      <aside
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "50vw",
          height: "100vh",
          background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
          borderLeft: "1px solid #dbeafe",
          boxShadow: "-12px 0 36px rgba(37, 99, 235, 0.14)",
          zIndex: 1000,
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.32s ease",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: 24,
            borderBottom: "1px solid #dbeafe",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            background: "rgba(239, 246, 255, 0.75)",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#3b82f6",
                marginBottom: 6,
              }}
            >
              Activity stream
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: 28,
                lineHeight: 1.1,
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              Agent logs
            </h2>
          </div>

          <button
            onClick={() => setOpen(false)}
            style={{
              border: "1px solid #bfdbfe",
              borderRadius: 12,
              background: "#ffffff",
              padding: "10px 14px",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 700,
              color: "#2563eb",
              boxShadow: "0 4px 10px rgba(59, 130, 246, 0.08)",
            }}
          >
            Close
          </button>
        </div>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            padding: 20,
            overflow: "hidden",
          }}
        >
          <AgentLogsPanel logs={logs} />
        </div>
      </aside>
    </>
  );
}
