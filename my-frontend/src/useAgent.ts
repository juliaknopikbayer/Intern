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
  type DashboardNode,
  type GeneratedDashboardPayload,
  type SavedDashboardListItem,
} from "./api";

const USER_ID = "test_user";

export function useAgent() {
  const [status, setStatus] = useState<"idle" | "running" | "waiting_hitl" | "completed" | "error">("idle");
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [openuiResponse, setOpenuiResponse] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hitlOpen, setHitlOpen] = useState(false);
  const [hitlSql, setHitlSql] = useState("");
  const [hitlExplanation, setHitlExplanation] = useState("");
  const [threadId, setThreadId] = useState("");

  const [generatedDashboard, setGeneratedDashboard] = useState<GeneratedDashboardPayload | null>(null);
  const [dashboardLayout, setDashboardLayout] = useState<DashboardNode[]>([]);
  const [hasPersistedLayout, setHasPersistedLayout] = useState(false);
  const [savedDashboards, setSavedDashboards] = useState<SavedDashboardListItem[]>([]);
  const [selectedDashboardId, setSelectedDashboardId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedDashboardsLoading, setSavedDashboardsLoading] = useState(false);

  const handlers = {
    onLog: (log: AgentLog) => setLogs((previous) => [...previous, log]),
    onDone: (payload: GeneratedDashboardPayload) => {
      setOpenuiResponse(payload.openui_response);
      setGeneratedDashboard(payload);
      setDashboardLayout([]); // OpenUIRenderer will use its freshly parsed tree.
      setHasPersistedLayout(false);
      setSelectedDashboardId(null);
      setHitlOpen(false);
      setStatus("completed");
    },
    onHitl: ({ threadId, sql, explanation }: { threadId: string; sql: string; explanation: string }) => {
      setThreadId(threadId);
      setHitlSql(sql);
      setHitlExplanation(explanation);
      setHitlOpen(true);
      setStatus("waiting_hitl");
    },
    onError: (message: string) => {
      setError(message);
      setHitlOpen(false);
      setStatus("error");
    },
  };

  const loadDashboards = async () => {
    try {
      setSavedDashboardsLoading(true);
      const result = await listDashboards(USER_ID);
      setSavedDashboards(result.items || []);
    } catch (caught: any) {
      setError(caught.message || "Could not load dashboards");
    } finally {
      setSavedDashboardsLoading(false);
    }
  };

  useEffect(() => { void loadDashboards(); }, []);

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
    setDashboardLayout([]);
    setHasPersistedLayout(false);
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

  // Called by SortableContainer after removal/reordering.
  const updateDashboardLayout = (nodes: DashboardNode[]) => setDashboardLayout(nodes);

  const saveCurrentDashboard = async () => {
    if (!generatedDashboard) return;

    try {
      setIsSaving(true);
      setError(null);

      // A dashboard opened from the sidebar already has an id: update it,
      // do not create a duplicate record.
      if (selectedDashboardId !== null) {
        await updateDashboard(selectedDashboardId, {
          user_id: USER_ID,
          layout_nodes: dashboardLayout,
        });
        setHasPersistedLayout(true);
        await loadDashboards();
        return;
      }

      const defaultName = generatedDashboard.user_input?.slice(0, 50)?.trim() || "Saved dashboard";
      const name = window.prompt("Dashboard name:", defaultName);
      if (!name?.trim()) return;

      const saved = await saveDashboard({
        user_id: USER_ID,
        name: name.trim(),
        user_input: generatedDashboard.user_input,
        sql_queries: generatedDashboard.sql_queries,
        schema_text: generatedDashboard.schema_text,
        masked_data: generatedDashboard.masked_data,
        pii_mapping: generatedDashboard.pii_mapping,
        openui_response: generatedDashboard.openui_response,
        layout_nodes: dashboardLayout,
      });
      setSelectedDashboardId(saved.id);
      setHasPersistedLayout(true);
      await loadDashboards();
    } catch (caught: any) {
      setError(caught.message || "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const openSavedDashboard = async (id: number) => {
    try {
      setError(null);
      const dashboard = await reopenDashboard(id, USER_ID);
      setOpenuiResponse(dashboard.openui_response);
      setSelectedDashboardId(dashboard.id);
      setDashboardLayout(Array.isArray(dashboard.layout_nodes) ? dashboard.layout_nodes : []);
      setHasPersistedLayout(Array.isArray(dashboard.layout_nodes));
      setGeneratedDashboard({
        openui_response: dashboard.openui_response,
        sql_queries: dashboard.sql_queries || [],
        schema_text: dashboard.schema_text || "",
        masked_data: dashboard.masked_data || "",
        pii_mapping: dashboard.pii_mapping || {},
        user_input: dashboard.user_input || "",
        user_id: dashboard.owner_id || USER_ID,
      });
      setStatus("completed");
    } catch (caught: any) {
      setError(caught.message || "Failed to open dashboard");
    }
  };

  const renameSavedDashboard = async (id: number, currentName: string) => {
    const name = window.prompt("New dashboard name:", currentName);
    if (!name?.trim()) return;
    try {
      await updateDashboard(id, { user_id: USER_ID, name: name.trim() });
      await loadDashboards();
    } catch (caught: any) {
      setError(caught.message || "Rename failed");
    }
  };

  const removeSavedDashboard = async (id: number) => {
    if (!window.confirm("Delete this dashboard?")) return;
    try {
      await deleteDashboard(id, USER_ID);
      if (selectedDashboardId === id) {
        setSelectedDashboardId(null);
        setOpenuiResponse("");
        setGeneratedDashboard(null);
        setDashboardLayout([]);
        setHasPersistedLayout(false);
      }
      await loadDashboards();
    } catch (caught: any) {
      setError(caught.message || "Delete failed");
    }
  };

  return {
    status, logs, openuiResponse, error, send,
    hitlOpen, hitlSql, hitlExplanation, approveSql, rejectSql,
    generatedDashboard, dashboardLayout, hasPersistedLayout, updateDashboardLayout,
    savedDashboards, selectedDashboardId, saveCurrentDashboard,
    openSavedDashboard, renameSavedDashboard, removeSavedDashboard,
    savedDashboardsLoading, isSaving,
  };
}
<<<<<<< HEAD
=======




>>>>>>> d6979fdd218c81aaf015f61b8829b30214586460
