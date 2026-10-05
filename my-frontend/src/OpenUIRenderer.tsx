import React from "react";
import {
  ResponsiveContainer,
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart as ReLineChart,
  Line,
  AreaChart as ReAreaChart,
  Area,
  PieChart as RePieChart,
  Pie,
  Cell,
} from "recharts";
import { SortableContainer } from "./components/SortableContainer";
import type { DashboardNode } from "./api";

const CHART_COLORS = ["#2563eb", "#7c3aed", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#84cc16", "#f97316"];

type ChartType = "barVertical" | "barHorizontal" | "line" | "area" | "donut";

const SWITCHABLE_CHART_TYPES: { key: ChartType; label: string }[] = [
  { key: "barVertical", label: "Vertical bars" },
  { key: "barHorizontal", label: "Horizontal bars" },
  { key: "line", label: "Linear" },
  { key: "area", label: "Area" },
  { key: "donut", label: "Pie" },
];

function ChartCard({ title, children, height = 320 }: { title?: string; children: React.ReactNode; height?: number }) {
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 16, padding: 20, background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      {title && <div style={{ fontWeight: 600, fontSize: 15, color: "#0f172a", marginBottom: 16 }}>{title}</div>}
      <div style={{ width: "100%", height }}>{children}</div>
    </div>
  );
}

function DefaultTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: "10px 12px", boxShadow: "0 10px 25px rgba(15,23,42,0.12)", fontSize: 13 }}>
      {label !== undefined && <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>{String(label)}</div>}
      {payload.map((entry: any, index: number) => (
        <div key={index} style={{ display: "flex", alignItems: "center", gap: 8, color: "#334155", marginTop: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: entry.color, display: "inline-block" }} />
          <span style={{ fontWeight: 600 }}>{entry.name}:</span>
          <span>{entry.value?.toLocaleString?.() ?? String(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

function AngledTick({ x, y, payload }: any) {
  return <g transform={`translate(${x},${y})`}><text x={0} y={0} dy={10} textAnchor="end" transform="rotate(-35)" fill="#64748b" fontSize={12}>{String(payload?.value ?? "")}</text></g>;
}

function StackC({ children }: any) {
  return <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>{children}</div>;
}

function GridC({ columns, children }: any) {
  const cols = Number(columns) || 2;
  return <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 16 }}>{children}</div>;
}

function KPICardC({ title, value, subtitle, delta, deltaDirection }: any) {
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 16, padding: 20, background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: "#0f172a" }}>{value}</div>
      {subtitle && <div style={{ fontSize: 14, color: "#475569", marginTop: 8 }}>{subtitle}</div>}
      {delta && <div style={{ fontSize: 13, marginTop: 8, fontWeight: 600, color: deltaDirection === "up" ? "#10b981" : deltaDirection === "down" ? "#ef4444" : "#64748b" }}>{delta}</div>}
    </div>
  );
}

function escapeCsvValue(value: unknown): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function downloadCsv(columns: string[], rows: any[][], title?: string) {
  const csv = [columns.map(escapeCsvValue).join(","), ...rows.map((row) => row.map(escapeCsvValue).join(","))].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${(title || "table-data").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "") || "table-data"}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function DataTableC({ title, columns, rows }: any) {
  const cols = Array.isArray(columns) ? columns : [];
  const dataRows = Array.isArray(rows) ? rows : [];
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 16, background: "white", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      {title && <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", fontWeight: 600, fontSize: 15, color: "#0f172a" }}>{title}</div>}
      <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}><thead style={{ background: "#f8fafc" }}><tr>{cols.map((col: string, index: number) => <th key={index} style={{ textAlign: "left", padding: "12px 16px", borderBottom: "2px solid #e2e8f0", color: "#475569", fontWeight: 600, whiteSpace: "nowrap" }}>{col}</th>)}</tr></thead><tbody>{dataRows.map((row: any[], rowIndex: number) => <tr key={rowIndex} style={{ borderBottom: "1px solid #f1f5f9" }}>{row.map((cell: any, cellIndex: number) => <td key={cellIndex} style={{ padding: "12px 16px", color: "#0f172a", whiteSpace: "nowrap" }}>{String(cell)}</td>)}</tr>)}</tbody></table></div>
      <div style={{ padding: "12px 16px", display: "flex", justifyContent: "flex-end", borderTop: "1px solid #eff6ff", background: "#fcfdff" }}><button type="button" onClick={() => downloadCsv(cols, dataRows, title)} style={{ border: "1px solid #bfdbfe", borderRadius: 999, background: "#eff6ff", color: "#2563eb", padding: "7px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Download to Excel</button></div>
    </div>
  );
}

function VerticalBarChartC({ title, labels, values }: any) {
  const data = (Array.isArray(labels) ? labels : []).map((label: string, index: number) => ({ label, value: Number((Array.isArray(values) ? values : [])[index] ?? 0) }));
  return <ChartCard title={title} height={340}><ResponsiveContainer width="100%" height="100%"><ReBarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 90 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} /><XAxis dataKey="label" stroke="#cbd5e1" interval={0} height={90} tickLine={false} tick={<AngledTick />} /><YAxis stroke="#cbd5e1" tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={false} allowDecimals={false} /><Tooltip content={<DefaultTooltip />} /><Bar dataKey="value" name="Value" fill="#2563eb" radius={[8, 8, 0, 0]} maxBarSize={64} animationDuration={500} /></ReBarChart></ResponsiveContainer></ChartCard>;
}

function BarChartC({ title, labels, values }: any) {
  const data = (Array.isArray(labels) ? labels : []).map((label: string, index: number) => ({ label, value: Number((Array.isArray(values) ? values : [])[index] ?? 0) }));
  return <ChartCard title={title} height={Math.max(280, data.length * 48)}><ResponsiveContainer width="100%" height="100%"><ReBarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 16, bottom: 8 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis type="number" stroke="#64748b" /><YAxis type="category" dataKey="label" stroke="#64748b" width={140} tick={{ fontSize: 12 }} /><Tooltip content={<DefaultTooltip />} /><Legend /><Bar dataKey="value" name="Value" fill="#2563eb" radius={[0, 8, 8, 0]} animationDuration={500} /></ReBarChart></ResponsiveContainer></ChartCard>;
}

function LineChartC({ title, data, xKey = "label", yKey = "value" }: any) {
  const chartData = Array.isArray(data) ? data : [];
  return <ChartCard title={title}><ResponsiveContainer width="100%" height="100%"><ReLineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 90 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} /><XAxis dataKey={xKey} stroke="#cbd5e1" interval={0} height={90} tickLine={false} tick={<AngledTick />} /><YAxis stroke="#cbd5e1" tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={false} /><Tooltip content={<DefaultTooltip />} /><Line type="monotone" dataKey={yKey} stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name={yKey} animationDuration={500} /></ReLineChart></ResponsiveContainer></ChartCard>;
}

function AreaChartC({ title, data, xKey = "label", yKey = "value" }: any) {
  const chartData = Array.isArray(data) ? data : [];
  return <ChartCard title={title}><ResponsiveContainer width="100%" height="100%"><ReAreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 90 }}><defs><linearGradient id="colorAreaMain" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} /><stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} /><XAxis dataKey={xKey} stroke="#cbd5e1" interval={0} height={90} tickLine={false} tick={<AngledTick />} /><YAxis stroke="#cbd5e1" tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={false} /><Tooltip content={<DefaultTooltip />} /><Legend /><Area type="monotone" dataKey={yKey} stroke="#2563eb" fill="url(#colorAreaMain)" strokeWidth={3} name={yKey} animationDuration={500} /></ReAreaChart></ResponsiveContainer></ChartCard>;
}

function DonutChartC({ title, data, nameKey = "name", valueKey = "value" }: any) {
  const chartData = Array.isArray(data) ? data : [];
  return <ChartCard title={title}><ResponsiveContainer width="100%" height="100%"><RePieChart><Tooltip content={<DefaultTooltip />} /><Legend /><Pie data={chartData} dataKey={valueKey} nameKey={nameKey} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={3} animationDuration={500}>{chartData.map((_: any, index: number) => <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}</Pie></RePieChart></ResponsiveContainer></ChartCard>;
}

function StackedBarChartC({ title, data, xKey = "label", series = [] }: any) {
  const chartData = Array.isArray(data) ? data : [];
  const chartSeries = Array.isArray(series) ? series : [];
  return <ChartCard title={title} height={340}><ResponsiveContainer width="100%" height="100%"><ReBarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 90 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} /><XAxis dataKey={xKey} stroke="#cbd5e1" interval={0} height={90} tickLine={false} tick={<AngledTick />} /><YAxis stroke="#cbd5e1" tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={false} allowDecimals={false} /><Tooltip content={<DefaultTooltip />} /><Legend />{chartSeries.map((key: string, index: number) => <Bar key={key} dataKey={key} stackId="total" fill={CHART_COLORS[index % CHART_COLORS.length]} radius={index === chartSeries.length - 1 ? [8, 8, 0, 0] : [0, 0, 0, 0]} maxBarSize={64} animationDuration={500} />)}</ReBarChart></ResponsiveContainer></ChartCard>;
}

function ReportSectionC({ heading, body }: any) {
  const lines = String(body || "").split("\n");
  return <div style={{ border: "1px solid #e2e8f0", borderRadius: 16, padding: 20, background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}><h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{heading}</h3><div style={{ fontSize: 14, color: "#334155", lineHeight: 1.7 }}>{lines.map((line, index) => <div key={index}>{line || <br />}</div>)}</div></div>;
}

function SwitchableChart({ title, labels, values, editable, defaultType, onChartTypeChange }: {
  title?: string;
  labels?: string[];
  values?: number[];
  editable: boolean;
  defaultType: ChartType;
  onChartTypeChange: (type: ChartType) => void;
}) {
  // The persisted node prop is the source of truth. This local state is only for immediate UI feedback.
  const [type, setType] = React.useState<ChartType>(defaultType);
  React.useEffect(() => setType(defaultType), [defaultType]);

  const lbls = Array.isArray(labels) ? labels : [];
  const vals = Array.isArray(values) ? values : [];
  const data = lbls.map((label, index) => ({ label, name: label, value: Number(vals[index] ?? 0) }));

  let chart: React.ReactNode;
  switch (type) {
    case "barHorizontal": chart = <BarChartC title={title} labels={lbls} values={vals} />; break;
    case "line": chart = <LineChartC title={title} data={data} xKey="label" yKey="value" />; break;
    case "area": chart = <AreaChartC title={title} data={data} xKey="label" yKey="value" />; break;
    case "donut": chart = <DonutChartC title={title} data={data} nameKey="name" valueKey="value" />; break;
    default: chart = <VerticalBarChartC title={title} labels={lbls} values={vals} />;
  }

  return <div>{editable && <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10, padding: "10px 12px", border: "1px solid #dbeafe", borderRadius: 14, background: "#f8fbff" }}><span style={{ display: "flex", alignItems: "center", marginRight: 4, color: "#475569", fontSize: 12, fontWeight: 700 }}>Chart type:</span>{SWITCHABLE_CHART_TYPES.map((chartType) => { const active = chartType.key === type; return <button key={chartType.key} type="button" onClick={() => { setType(chartType.key); onChartTypeChange(chartType.key); }} style={{ border: active ? "1px solid #2563eb" : "1px solid #bfdbfe", borderRadius: 999, background: active ? "#2563eb" : "white", color: active ? "white" : "#2563eb", padding: "6px 11px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{chartType.label}</button>; })}</div>}{chart}</div>;
}

const registry: Record<string, React.ComponentType<any>> = {
  Stack: StackC,
  Grid: GridC,
  KPICard: KPICardC,
  DataTable: DataTableC,
  LineChart: LineChartC,
  AreaChart: AreaChartC,
  DonutChart: DonutChartC,
  StackedBarChart: StackedBarChartC,
  ReportSection: ReportSectionC,
};

function renderNode(node: DashboardNode, editable: boolean, onNodeChange?: (nextNode: DashboardNode) => void): React.ReactNode {
  if (node.tag === "VerticalBarChart" || node.tag === "BarChart") {
    const defaultType: ChartType = node.props.chartType as ChartType || (node.tag === "BarChart" ? "barHorizontal" : "barVertical");
    return <SwitchableChart title={node.props.title as string | undefined} labels={node.props.labels as string[] | undefined} values={node.props.values as number[] | undefined} editable={editable} defaultType={defaultType} onChartTypeChange={(chartType) => onNodeChange?.({ ...node, props: { ...node.props, chartType } })} />;
  }

  const Component = registry[node.tag];
  if (!Component) {
    console.warn(`Unknown OpenUI component: ${node.tag}`);
    return null;
  }

  // A nested chart changes the parent node. This makes chart type persistence work
  // for layouts such as Stack > Grid > VerticalBarChart too.
  const children = node.children.map((child, index) => (
    <React.Fragment key={index}>
      {renderNode(child, editable, (nextChild) => {
        const nextChildren = node.children.map((currentChild, currentIndex) => currentIndex === index ? nextChild : currentChild);
        onNodeChange?.({ ...node, children: nextChildren });
      })}
    </React.Fragment>
  ));

  return <Component {...node.props}>{children}</Component>;
}

function parseOpenUI(input: string): DashboardNode | null {
  const text = input.trim();
  if (!text) return null;
  let pos = 0;
  const skipWhitespace = () => { while (pos < text.length && /\s/.test(text[pos])) pos++; };
  const match = (value: string) => { if (text.substring(pos, pos + value.length) === value) { pos += value.length; return true; } return false; };
  const expect = (value: string) => { skipWhitespace(); if (!match(value)) throw new Error(`Expected "${value}" at pos ${pos}`); };
  const peek = () => text[pos] || "";
  const parseName = () => { let name = ""; while (pos < text.length && /[a-zA-Z0-9_]/.test(text[pos])) name += text[pos++]; return name; };
  const parseStringValue = () => { expect('"'); let value = ""; while (pos < text.length && text[pos] !== '"') value += text[pos++]; expect('"'); return value; };
  const parseArrayValue = () => { expect("{"); let depth = 1; let content = ""; while (pos < text.length && depth > 0) { const character = text[pos]; if (character === "{" || character === "[") { depth++; content += character; } else if (character === "}" || character === "]") { depth--; if (depth > 0) content += character; } else content += character; pos++; } try { return JSON.parse(content); } catch { return content; } };
  const parseProps = () => { const props: Record<string, unknown> = {}; while (true) { skipWhitespace(); if (peek() === ">" || (peek() === "/" && text[pos + 1] === ">")) break; const name = parseName(); if (!name) break; skipWhitespace(); if (peek() !== "=") break; expect("="); skipWhitespace(); if (peek() === '"') props[name] = parseStringValue(); else if (peek() === "{") props[name] = parseArrayValue(); } return props; };
  const parseComponent = (): DashboardNode => { skipWhitespace(); expect("<"); const tag = parseName(); const props = parseProps(); skipWhitespace(); if (match("/>")) return { tag, props, children: [] }; expect(">"); const children: DashboardNode[] = []; while (true) { skipWhitespace(); if (match("</")) { parseName(); skipWhitespace(); expect(">"); break; } if (peek() === "<") children.push(parseComponent()); else if (pos < text.length) pos++; } return { tag, props, children }; };
  return parseComponent();
}

export function OpenUIRenderer({ response, editable, dashboardKey, savedLayout, hasPersistedLayout, onLayoutChange }: {
  response: string;
  editable: boolean;
  dashboardKey: string;
  savedLayout: DashboardNode[];
  hasPersistedLayout: boolean;
  onLayoutChange: (nodes: DashboardNode[]) => void;
}) {
  if (!response?.trim()) return <div style={{ color: "#64748b", fontSize: 14, padding: 20 }}>The generated UI will appear here.</div>;

  try {
    const tree = parseOpenUI(response);
    if (!tree) return <div style={{ color: "#ef4444", fontSize: 14, padding: 20 }}>Failed to parse OpenUI response.</div>;

    const isStack = tree.tag === "Stack";
    const isGrid = tree.tag === "Grid";
    const sortable = (isStack || isGrid) && tree.children.length > 0;
    const defaultNodes = tree.children;
    const initialNodes = hasPersistedLayout ? savedLayout : defaultNodes;

    if (!sortable) return <div>{renderNode(tree, editable)}</div>;

    return <SortableContainer key={dashboardKey} layout={isGrid ? "grid" : "stack"} columns={isGrid ? Number(tree.props.columns) || 2 : undefined} initialNodes={initialNodes} defaultNodes={defaultNodes} editable={editable} renderNode={(node, onNodeChange) => renderNode(node, editable, onNodeChange)} onLayoutChange={onLayoutChange} />;
  } catch (error: any) {
    return <div style={{ color: "#ef4444", fontSize: 14, padding: 20 }}>OpenUI parsing error: {error.message}<pre style={{ marginTop: 12, fontSize: 11, color: "#64748b", whiteSpace: "pre-wrap", background: "#f8fafc", padding: 12, borderRadius: 8 }}>{response.substring(0, 500)}...</pre></div>;
  }
}
