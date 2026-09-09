import { useEffect, useState } from "react";
import {
  streamAgent2,
  resumeAgent,
  listDashboards,
  saveDashboard,
  reopenDashboard,
  updateDashboard,
  deleteDashboard,
  type AgentLog,
  type GeneratedDashboardPayload,
  type SavedDashboardListItem,
} from "./api";

const USER_ID = "test_user";


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
  
  const [generatedDashboard, setGeneratedDashboard] = useState<GeneratedDashboardPayload | null>(null);
  const [savedDashboards, setSavedDashboards] = useState<SavedDashboardListItem[]>([]);
  const [selectedDashboardId, setSelectedDashboardId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedDashboardsLoading, setSavedDashboardsLoading] = useState(false);


  const handlers = {
    onLog: (log: AgentLog) => {
      setLogs((prev) => [...prev, log]);
    },

    onDone: (payload: GeneratedDashboardPayload) => {
	setGeneratedDashboard(payload);
	setOpenuiResponse(payload.openui_response);
	setSelectedDashboardId(null);
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
	setSelectedDashboardId(null);
	setGeneratedDashboard(null);


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
  const loadDashboards = async () => {
  try {
    setSavedDashboardsLoading(true);
    const result = await listDashboards(USER_ID);
    setSavedDashboards(result.items || []);
  } catch (e: any) {
    console.error(e);
  } finally {
    setSavedDashboardsLoading(false);
  }
};

useEffect(() => {
  loadDashboards();
}, []);

  
  const saveCurrentDashboard = async () => {
	if (!generatedDashboard) return;

	const defaultName =
		generatedDashboard.user_input?.slice(0, 50)?.trim() || "Saved dashboard";

	const name = window.prompt("Dashboard name:", defaultName);
	if (!name?.trim()) return;

	try {
		setIsSaving(true);

		const saved = await saveDashboard({
		  user_id: USER_ID,
		  name: name.trim(),
		  user_input: generatedDashboard.user_input,
		  sql_queries: generatedDashboard.sql_queries,
		  schema_text: generatedDashboard.schema_text,
		  masked_data: generatedDashboard.masked_data,
		  pii_mapping: generatedDashboard.pii_mapping,
		  openui_response: generatedDashboard.openui_response,
		});

		setSelectedDashboardId(saved.id ?? null);
		await loadDashboards();
	} catch (e: any) {
		setError(e.message || "Save failed");
	} finally {
		setIsSaving(false);
	}
	};
  const openSavedDashboard = async (id: number) => {
	try {
		const dashboard = await reopenDashboard(id, USER_ID);
		setOpenuiResponse(dashboard.openui_response || "");
		setSelectedDashboardId(dashboard.id);
		setGeneratedDashboard(null);
		setError(null);
		setStatus("completed");
	} catch (e: any) {
		setError(e.message || "Failed to reopen dashboard");
	}
	};
	
  const renameSavedDashboard = async (id: number, currentName: string) => {
	const nextName = window.prompt("New dashboard name:", currentName);
	if (!nextName?.trim()) return;

	try {
		await updateDashboard(id, {
		user_id: USER_ID,
		name: nextName.trim(),
		});
		await loadDashboards();
	} catch (e: any) {
		setError(e.message || "Rename failed");
	}
	};

  const removeSavedDashboard = async (id: number) => {
	const confirmed = window.confirm("Delete this dashboard?");
	if (!confirmed) return;

	try {
		await deleteDashboard(id, USER_ID);

		if (selectedDashboardId === id) {
		setSelectedDashboardId(null);
		setOpenuiResponse("");
		}

		await loadDashboards();
	} catch (e: any) {
		setError(e.message || "Delete failed");
	}
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
	  generatedDashboard,
	  savedDashboards,
	  selectedDashboardId,
	  saveCurrentDashboard,
	  openSavedDashboard,
	  renameSavedDashboard,
	  removeSavedDashboard,
	  savedDashboardsLoading,
	  isSaving,
	};

}




