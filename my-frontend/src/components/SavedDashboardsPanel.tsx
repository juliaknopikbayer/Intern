import React from "react";
import type { SavedDashboardListItem } from "../api";

type Props = {
  items: SavedDashboardListItem[];
  selectedDashboardId: number | null;
  loading?: boolean;
  onOpen: (id: number) => void;
  onRename: (id: number, currentName: string) => void;
  onDelete: (id: number) => void;
};

export function SavedDashboardsPanel({
  items,
  selectedDashboardId,
  loading = false,
  onOpen,
  onRename,
  onDelete,
}: Props) {
  return (
    <div
      style={{
        marginTop: 24,
        paddingTop: 20,
        borderTop: "1px solid #dbeafe",
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "#2563eb",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 12,
        }}
      >
        Saved Dashboards
      </div>

      {loading ? (
        <div style={{ fontSize: 14, color: "#64748b" }}>Loading...</div>
      ) : items.length === 0 ? (
        <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
          No saved dashboards yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((item) => {
            const active = selectedDashboardId === item.id;

            return (
              <div
                key={item.id}
                style={{
                  border: active ? "1px solid #60a5fa" : "1px solid #dbeafe",
                  background: active ? "#eff6ff" : "#ffffff",
                  borderRadius: 16,
                  padding: 12,
                }}
              >
                <button
                  onClick={() => onOpen(item.id)}
                  style={{
                    border: "none",
                    background: "transparent",
                    padding: 0,
                    margin: 0,
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#0f172a",
                      marginBottom: 6,
                    }}
                  >
                    {item.name}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: "#64748b",
                      lineHeight: 1.5,
                      marginBottom: 8,
                    }}
                  >
                    {item.user_input}
                  </div>
                </button>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>
                    Updated: {new Date(item.updated_at).toLocaleString()}
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => onRename(item.id, item.name)}
                      style={smallButtonStyle()}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      style={smallDangerButtonStyle()}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function smallButtonStyle(): React.CSSProperties {
  return {
    border: "1px solid #bfdbfe",
    borderRadius: 10,
    background: "#eff6ff",
    color: "#1d4ed8",
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  };
}

function smallDangerButtonStyle(): React.CSSProperties {
  return {
    border: "1px solid #fecaca",
    borderRadius: 10,
    background: "#fff1f2",
    color: "#b91c1c",
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  };
}
