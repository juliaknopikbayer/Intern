// {
  // "status": "completed",
  // "logs": [...],
  // "openui_response": "<Stack>...</Stack>"
// }


export type AgentLog = {
  timestamp: string;
  step: string;
  message: string;
  level: string;
};

export type AgentResponse = {
  status: "completed" | "error";
  logs: AgentLog[];
  openui_response: string;
  error?: string;
};


type StreamHandlers = {
  onLog: (log: AgentLog) => void;
  onDone: (openuiResponse: string) => void;
  onHitl: (payload: { threadId: string; sql: string; explanation: string }) => void;
  onError: (error: string) => void;
};



export async function runAgent(message: string): Promise<AgentResponse> {
  const response = await fetch("http://localhost:8000/api/agent/run", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

export function streamAgent(
  message: string,
  onLog: (log: AgentLog) => void,
  onDone: (openuiResponse: string) => void,
  onError: (error: string) => void
) {
  fetch("/api/agent/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  })
    .then(async (response) => {
      if (!response.ok) {
        onError(`HTTP ${response.status}`);
        return;
      }
      if (!response.body) {
        onError("Brak strumienia odpowiedzi");
        return;
      }

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

          const jsonStr = line.slice(5).trim();
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr);
            if (event.type === "log") {
              onLog(event.log);
            } else if (event.type === "done") {
              onDone(event.openui_response || "");
            } else if (event.type === "error") {
              onError(event.error || "Nieznany blad");
            }
          } catch {
            // ignoruj niekompletne fragmenty
          }
        }
      }
    })
    .catch((e) => onError(e.message || "Request failed"));
}











async function consumeStream(response: Response, handlers: StreamHandlers) {
  if (!response.ok) {
    handlers.onError(`HTTP ${response.status}`);
    return;
  }

  if (!response.body) {
    handlers.onError("Brak strumienia odpowiedzi");
    return;
  }

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

      const jsonStr = line.slice(5).trim();
      if (!jsonStr) continue;

      try {
        const event = JSON.parse(jsonStr);

        if (event.type === "log") {
          handlers.onLog(event.log);
        } else if (event.type === "done") {
          handlers.onDone(event.openui_response || "");
        } else if (event.type === "hitl") {
          handlers.onHitl({
            threadId: event.thread_id,
            sql: event.sql || "",
            explanation: event.explanation || "",
          });
        } else if (event.type === "error") {
          handlers.onError(event.error || "Nieznany blad");
        }
      } catch {
        // ignore
      }
    }
  }
}

export function streamAgent2(message: string, handlers: StreamHandlers) {
  fetch("/api/agent/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  })
    .then((response) => consumeStream(response, handlers))
    .catch((e) => handlers.onError(e.message || "Request failed"));
}

export function resumeAgent(
  threadId: string,
  decision: "accept" | "reject",
  handlers: StreamHandlers
) {
  fetch("/api/agent/resume", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ thread_id: threadId, decision }),
  })
    .then((response) => consumeStream(response, handlers))
    .catch((e) => handlers.onError(e.message || "Request failed"));
}
