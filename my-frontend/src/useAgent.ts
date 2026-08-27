import { useState } from "react";
import {
  streamAgent2,
  resumeAgent,
  type AgentLog,
} from "./api";

export function useAgent() {
  const [status, setStatus] = useState<
    "idle" | "running" | "waiting_hitl" | "completed" | "error"
  >("idle");

  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [openuiResponse, setOpenuiResponse] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [hitlOpen, setHitlOpen] = useState(false);
  const [hitlSql, setHitlSql] = useState("");
  const [hitlExplanation, setHitlExplanation] = useState("");
  const [threadId, setThreadId] = useState("");

  const handlers = {
    onLog: (log: AgentLog) => {
      setLogs((prev) => [...prev, log]);
    },

    onDone: (openui: string) => {
      setOpenuiResponse(openui);
      setHitlOpen(false);
      setStatus("completed");
    },

    onHitl: ({
      threadId,
      sql,
      explanation,
    }: {
      threadId: string;
      sql: string;
      explanation: string;
    }) => {
      setThreadId(threadId);
      setHitlSql(sql);
      setHitlExplanation(explanation);
      setHitlOpen(true);
      setStatus("waiting_hitl");
    },

    onError: (err: string) => {
      setError(err);
      setHitlOpen(false);
      setStatus("error");
    },
  };

  const send = (message: string) => {
    setStatus("running");
    setLogs([]);
    setOpenuiResponse("");
    setError(null);
    setHitlOpen(false);
    setHitlSql("");
    setHitlExplanation("");
    setThreadId("");

    streamAgent2(message, handlers);
  };

  const approveSql = () => {
    if (!threadId) return;
    setStatus("running");
    setHitlOpen(false);
    resumeAgent(threadId, "accept", handlers);
  };

  const rejectSql = () => {
    if (!threadId) return;
    setStatus("running");
    setHitlOpen(false);
    resumeAgent(threadId, "reject", handlers);
  };

  return {
    status,
    logs,
    openuiResponse,
    error,
    send,
    hitlOpen,
    hitlSql,
    hitlExplanation,
    approveSql,
    rejectSql,
  };
}



// import { useState } from "react";
// import { runAgent,streamAgent, type AgentLog } from "./api";


// export function useAgent() {
  // const [status, setStatus] = useState<"idle" | "running" | "completed" | "error">("idle");
  // const [logs, setLogs] = useState<AgentLog[]>([]);
  // const [openuiResponse, setOpenuiResponse] = useState("");
  // const [error, setError] = useState<string | null>(null);
  
  // const [hitlOpen, setHitlOpen] = useState(false);
  // const [hitlSql, setHitlSql] = useState("");
  // const [hitlExplanation, setHitlExplanation] = useState("");
  // const [threadId, setThreadId] = useState("");

  // // const send = async (message: string) => {
    // // setStatus("running");
    // // setLogs([]);
    // // setOpenuiResponse("");
    // // setError(null);

    // // try {
      // // const result = await runAgent(message);

      // // setLogs(result.logs || []);

      // // if (result.status === "completed") {
        // // setOpenuiResponse(result.openui_response || "");
        // // setStatus("completed");
      // // } else {
        // // setError(result.error || "Unknown error");
        // // setStatus("error");
      // // }
    // // } catch (e: any) {
      // // setError(e.message || "Request failed");
      // // setStatus("error");
    // // }
  // // };
  
  
  // const handlers = {
    // onLog: (log: AgentLog) => setLogs((prev) => [...prev, log]),
    // onDone: (openui: string) => {
      // setOpenuiResponse(openui);
      // setHitlOpen(false);
      // setStatus("completed");
    // },
    // onHitl: ({
      // threadId,
      // sql,
      // explanation,
    // }: {
      // threadId: string;
      // sql: string;
      // explanation: string;
    // }) => {
      // setThreadId(threadId);
      // setHitlSql(sql);
      // setHitlExplanation(explanation);
      // setHitlOpen(true);
      // setStatus("waiting_hitl");
    // },
    // onError: (err: string) => {
      // setError(err);
      // setHitlOpen(false);
      // setStatus("error");
    // },
  // };
  
  // const send = (message: string) => {
    // setStatus("running");
    // setLogs([]);
    // setOpenuiResponse("");
    // setError(null);

    // streamAgent(
      // message,
      // (log) => setLogs((prev) => [...prev, log]),
      // (openui) => {
        // setOpenuiResponse(openui);
        // setStatus("completed");
      // },
      // (err) => {
        // setError(err);
        // setStatus("error");
      // }
    // );
  // };
  
  // // const send = (message: string) => {
    // // setStatus("running");
    // // setLogs([]);
    // // setOpenuiResponse("");
    // // setError(null);
    // // setHitlOpen(false);
    // // setHitlSql("");
    // // setHitlExplanation("");
    // // setThreadId("");

    // // streamAgent(message, handlers);
  // // };

  // // const approveSql = () => {
    // // setStatus("running");
    // // setHitlOpen(false);
    // // resumeAgent(threadId, "accept", handlers);
  // // };

  // // const rejectSql = () => {
    // // setStatus("running");
    // // setHitlOpen(false);
    // // resumeAgent(threadId, "reject", handlers);
  // // };


  // return {
    // status,
    // logs,
    // openuiResponse,
    // error,
    // send,
  // };
  
  // // return {
    // // status,
    // // logs,
    // // openuiResponse,
    // // error,
    // // send,
    // // hitlOpen,
    // // hitlSql,
    // // hitlExplanation,
    // // approveSql,
    // // rejectSql,
  // // };
  
// }
