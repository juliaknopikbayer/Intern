import React from "react";

type Props = {
  open: boolean;
  sql: string;
  explanation: string;
  onApprove: () => void;
  onReject: () => void;
};

export function HitlModal({
  open,
  sql,
  explanation,
  onApprove,
  onReject,
}: Props) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.28)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        zIndex: 2000,
      }}
    >
      <div
        style={{
          width: "min(920px, 100%)",
          maxHeight: "90vh",
          overflow: "hidden",
          background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
          border: "1px solid #dbeafe",
          borderRadius: 24,
          boxShadow: "0 24px 60px rgba(37, 99, 235, 0.18)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: 24,
            borderBottom: "1px solid #dbeafe",
            background: "rgba(239, 246, 255, 0.72)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#3b82f6",
              marginBottom: 8,
            }}
          >
            Human in the loop
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: 28,
              lineHeight: 1.15,
              fontWeight: 800,
              color: "#0f172a",
            }}
          >
            Review generated SQL
          </h2>

          <p
            style={{
              marginTop: 12,
              marginBottom: 0,
              fontSize: 14,
              lineHeight: 1.7,
              color: "#475569",
            }}
          >
            Review the generated SQL query before execution. Confirm if it is
            consistent with the business intent and safe to run.
          </p>
        </div>

        <div
          style={{
            padding: 24,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <div
            style={{
              border: "1px solid #dbeafe",
              background: "#f8fbff",
              borderRadius: 18,
              padding: 16,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "#2563eb",
                marginBottom: 10,
              }}
            >
              Explanation
            </div>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.7,
                color: "#334155",
              }}
            >
              {explanation || "No explanation available."}
            </div>
          </div>

          <div
            style={{
              border: "1px solid #dbeafe",
              background: "#eff6ff",
              borderRadius: 18,
              padding: 16,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "#2563eb",
                marginBottom: 10,
              }}
            >
              SQL query
            </div>

            <pre
              style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontSize: 14,
                lineHeight: 1.7,
                color: "#0f172a",
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              }}
            >
              {sql}
            </pre>
          </div>
        </div>

        <div
          style={{
            padding: 20,
            borderTop: "1px solid #dbeafe",
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            background: "#ffffff",
          }}
        >
          <button
            onClick={onReject}
            style={{
              border: "1px solid #fecaca",
              borderRadius: 14,
              background: "#fff1f2",
              color: "#b91c1c",
              padding: "12px 18px",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Reject
          </button>

          <button
            onClick={onApprove}
            style={{
              border: "none",
              borderRadius: 14,
              background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              color: "white",
              padding: "12px 18px",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 10px 20px rgba(37, 99, 235, 0.24)",
            }}
          >
            Approve and continue
          </button>
        </div>
      </div>
    </div>
  );
}
