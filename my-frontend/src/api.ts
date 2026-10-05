<<<<<<< HEAD
export type AgentLog = { timestamp: string; step: string; message: string; level: string };
export type DashboardNode = { tag: string; props: Record<string, any>; children: DashboardNode[] };
export type GeneratedDashboardPayload = {
  openui_response: string; sql_queries: string[]; schema_text: string; masked_data: string;
  pii_mapping: Record<string, string>; user_input: string; user_id: string;
=======
export type AgentLog = {
  timestamp: string;
  step: string;
  message: string;
  level: string;
>>>>>>> d6979fdd218c81aaf015f61b8829b30214586460
};
export type SavedDashboardListItem = {
  id: number; name: string; user_input: string; created_at: string; updated_at: string;
};
export type SavedDashboard = GeneratedDashboardPayload & {
  id: number; owner_id: string; name: string; layout_nodes: DashboardNode[] | null;
  created_at: string; updated_at: string;
};
export type DashboardListResponse = { items: SavedDashboardListItem[]; limit: number; offset: number };

type StreamHandlers = {
  onLog: (log: AgentLog) => void;
  onDone: (payload: GeneratedDashboardPayload) => void;
  onHitl: (payload: { threadId: string; sql: string; explanation: string }) => void;
  onError: (message: string) => void;
};

const API_BASE = "http://localhost:8000";

async function consumeStream(response: Response, handlers: StreamHandlers) {
  if (!response.ok) return handlers.onError(`HTTP ${response.status}`);
  if (!response.body) return handlers.onError("Brak strumienia odpowiedzi");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() || "";
    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data:")) continue;
      try {
        const event = JSON.parse(line.slice(5).trim());
        if (event.type === "log") handlers.onLog(event.log);
        else if (event.type === "done") handlers.onDone({
          openui_response: event.openui_response || "", sql_queries: event.sql_queries || [],
          schema_text: event.schema_text || "", masked_data: event.masked_data || "",
          pii_mapping: event.pii_mapping || {}, user_input: event.user_input || "",
          user_id: event.user_id || "anonymous",
        });
        else if (event.type === "hitl") handlers.onHitl({
          threadId: event.thread_id, sql: event.sql || "", explanation: event.explanation || "",
        });
        else if (event.type === "error") handlers.onError(event.error || "Nieznany błąd");
      } catch { /* incomplete/invalid SSE event */ }
    }
  }
}

export function streamAgent2(message: string, handlers: StreamHandlers) {
  fetch(`${API_BASE}/api/agent/stream`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, user_id: "test_user" }),
  }).then((response) => consumeStream(response, handlers)).catch((error) => handlers.onError(error.message || "Request failed"));
}

export function resumeAgent(threadId: string, decision: "accept" | "reject", handlers: StreamHandlers) {
  fetch(`${API_BASE}/api/agent/resume`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ thread_id: threadId, decision }),
  }).then((response) => consumeStream(response, handlers)).catch((error) => handlers.onError(error.message || "Request failed"));
}

export async function listDashboards(userId: string): Promise<DashboardListResponse> {
  const response = await fetch(`${API_BASE}/api/dashboards?user_id=${encodeURIComponent(userId)}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export async function saveDashboard(payload: {
  user_id: string; name: string; user_input: string; sql_queries: string[]; schema_text: string;
  masked_data: string; pii_mapping: Record<string, string>; openui_response: string;
  layout_nodes: DashboardNode[];
}): Promise<SavedDashboard> {
  const response = await fetch(`${API_BASE}/api/dashboards`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export async function reopenDashboard(id: number, userId: string): Promise<SavedDashboard> {
  const response = await fetch(`${API_BASE}/api/dashboards/${id}/reopen?user_id=${encodeURIComponent(userId)}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export async function updateDashboard(id: number, payload: {
  user_id: string; name?: string; layout_nodes?: DashboardNode[];
}): Promise<SavedDashboard> {
  const response = await fetch(`${API_BASE}/api/dashboards/${id}`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export async function deleteDashboard(id: number, userId: string) {
  const response = await fetch(`${API_BASE}/api/dashboards/${id}?user_id=${encodeURIComponent(userId)}`, { method: "DELETE" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
