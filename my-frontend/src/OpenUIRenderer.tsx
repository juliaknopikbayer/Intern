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

const CHART_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#84cc16",
  "#f97316",
];

function ChartCard({
  title,
  children,
  height = 320,
}: {
  title?: string;
  children: React.ReactNode;
  height?: number;
}) {
  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        padding: 20,
        background: "white",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      {title && (
        <div
          style={{
            fontWeight: 600,
            fontSize: 15,
            color: "#0f172a",
            marginBottom: 16,
          }}
        >
          {title}
        </div>
      )}
      <div style={{ width: "100%", height }}>
        {children}
      </div>
    </div>
  );
}

function DefaultTooltip(props: any) {
  const { active, payload, label } = props;
  if (!active || !payload || !payload.length) return null;

  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: "10px 12px",
        boxShadow: "0 10px 25px rgba(15, 23, 42, 0.12)",
        fontSize: 13,
      }}
    >
      {label !== undefined && (
        <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
          {String(label)}
        </div>
      )}
      {payload.map((entry: any, i: number) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "#334155",
            marginTop: 4,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: entry.color,
              display: "inline-block",
            }}
          />
          <span style={{ fontWeight: 600 }}>{entry.name}:</span>
          <span>{entry.value?.toLocaleString?.() ?? String(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}


type OpenUINode = {
  tag: string;
  props: Record<string, any>;
  children: OpenUINode[];
};

// ─── CSV / Excel Helpers ───────────────────────────────────────
function escapeCsvValue(value: unknown): string {
  const stringValue = String(value ?? "");
  const escaped = stringValue.replace(/"/g, '""');
  return `"${escaped}"`;
}

function toCsv(columns: string[], rows: any[][]): string {
  const header = columns.map((col) => escapeCsvValue(col)).join(",");
  const body = rows
    .map((row) =>
      row.map((cell) => escapeCsvValue(cell)).join(",")
    )
    .join("\n");

  return [header, body].filter(Boolean).join("\n");
}

function downloadCsv(columns: string[], rows: any[][], fileName: string) {
  const csv = toCsv(columns, rows);
  const blob = new Blob(["\ufeff" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName.endsWith(".csv") ? fileName : `${fileName}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

function buildTableFileName(title?: string) {
  if (!title || !title.trim()) {
    return "table-data.csv";
  }

  const safe = title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");

  return `${safe || "table-data"}.csv`;
}

// ─── Parser OpenUI Lang ────────────────────────────────────────
function parseOpenUI(input: string): OpenUINode | null {
  const text = input.trim();
  if (!text) return null;

  let pos = 0;

  function skipWhitespace() {
    while (pos < text.length && /\s/.test(text[pos])) pos++;
  }

  function match(s: string): boolean {
    if (text.substring(pos, pos + s.length) === s) {
      pos += s.length;
      return true;
    }
    return false;
  }

  function expect(s: string) {
    skipWhitespace();
    if (!match(s)) {
      throw new Error(
        `Expected "${s}" at pos ${pos}, got "${text.substring(pos, pos + 30)}..."`
      );
    }
  }

  function peek(): string {
    return text[pos] || "";
  }

  function parseName(): string {
    let name = "";
    while (pos < text.length && /[a-zA-Z0-9_]/.test(text[pos])) {
      name += text[pos];
      pos++;
    }
    return name;
  }

  function parseStringValue(): string {
    expect('"');
    let value = "";
    while (pos < text.length && text[pos] !== '"') {
      value += text[pos];
      pos++;
    }
    expect('"');
    return value;
  }

  function parseArrayValue(): any {
    expect("{");
    let depth = 1;
    let content = "";
    while (pos < text.length && depth > 0) {
      const char = text[pos];
      if (char === "{" || char === "[") {
        depth++;
        content += char;
      } else if (char === "}" || char === "]") {
        depth--;
        if (depth > 0) content += char;
      } else {
        content += char;
      }
      pos++;
    }
    try {
      return JSON.parse(content);
    } catch {
      return content;
    }
  }

  function parseProps(): Record<string, any> {
    const props: Record<string, any> = {};
    while (true) {
      skipWhitespace();
      if (peek() === ">" || (peek() === "/" && text[pos + 1] === ">")) break;

      const name = parseName();
      if (!name) break;

      skipWhitespace();
      if (peek() !== "=") break;
      expect("=");
      skipWhitespace();

      if (peek() === '"') {
        props[name] = parseStringValue();
      } else if (peek() === "{") {
        props[name] = parseArrayValue();
      }
    }
    return props;
  }

  function parseComponent(): OpenUINode {
    skipWhitespace();
    expect("<");
    const tag = parseName();
    const props = parseProps();
    skipWhitespace();

    if (match("/>")) {
      return { tag, props, children: [] };
    }

    expect(">");
    const children: OpenUINode[] = [];

    while (true) {
      skipWhitespace();
      if (match("</")) {
        parseName();
        skipWhitespace();
        expect(">");
        break;
      }
      if (peek() === "<") {
        children.push(parseComponent());
      } else if (pos < text.length) {
        pos++;
      }
    }

    return { tag, props, children };
  }

  skipWhitespace();
  if (pos >= text.length) return null;
  return parseComponent();
}

// ─── Components ────────────────────────────────────────────────

function StackC({ children }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {children}
    </div>
  );
}

function GridC({ columns, children }: any) {
  const cols = Number(columns) || 2;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gap: 16,
      }}
    >
      {children}
    </div>
  );
}

function KPICardC({ title, value, subtitle, delta, deltaDirection }: any) {
  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        padding: 20,
        background: "white",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: "#64748b",
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          fontWeight: 600,
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color: "#0f172a" }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: 14, color: "#475569", marginTop: 8 }}>
          {subtitle}
        </div>
      )}
      {delta && (
        <div
          style={{
            fontSize: 13,
            marginTop: 8,
            fontWeight: 600,
            color:
              deltaDirection === "up"
                ? "#10b981"
                : deltaDirection === "down"
                ? "#ef4444"
                : "#64748b",
          }}
        >
          {delta}
        </div>
      )}
    </div>
  );
}

function DataTableC({ title, columns, rows }: any) {
  const cols = Array.isArray(columns) ? columns : [];
  const dataRows = Array.isArray(rows) ? rows : [];

  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        background: "white",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      {title && (
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #e2e8f0",
            fontWeight: 600,
            fontSize: 15,
            color: "#0f172a",
          }}
        >
          {title}
        </div>
      )}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}
        >
          <thead style={{ background: "#f8fafc" }}>
            <tr>
              {cols.map((col: string, i: number) => (
                <th
                  key={i}
                  style={{
                    textAlign: "left",
                    padding: "12px 16px",
                    borderBottom: "2px solid #e2e8f0",
                    color: "#475569",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row: any[], ri: number) => (
              <tr key={ri} style={{ borderBottom: "1px solid #f1f5f9" }}>
                {row.map((cell: any, ci: number) => (
                  <td
                    key={ci}
                    style={{
                      padding: "12px 16px",
                      color: "#0f172a",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          padding: "12px 16px",
          display: "flex",
          justifyContent: "flex-end",
          borderTop: "1px solid #eff6ff",
          background: "#fcfdff",
        }}
      >
        <button
          onClick={() => downloadCsv(cols, dataRows, buildTableFileName(title))}
          style={{
            border: "1px solid #bfdbfe",
            borderRadius: 999,
            background: "#eff6ff",
            color: "#2563eb",
            padding: "7px 12px",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 4px 10px rgba(59, 130, 246, 0.08)",
          }}
        >
          Download to Excel
        </button>
      </div>
    </div>
  );
}

function VerticalBarChartC({ title, labels, values }: any) {
  const lbls = Array.isArray(labels) ? labels : [];
  const vals = Array.isArray(values) ? values : [];

  const data = lbls.map((label: string, i: number) => ({
    label,
    value: Number(vals[i] ?? 0),
  }));

  return (
    <ChartCard title={title}>
      <ResponsiveContainer width="100%" height="100%">
        <ReBarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 12 }} />
          <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
          <Tooltip content={<DefaultTooltip />} />
          <Legend />
          <Bar
            dataKey="value"
            name="Value"
            fill="#2563eb"
            radius={[8, 8, 0, 0]}
            animationDuration={500}
          />
        </ReBarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function AreaChartC({ title, data, xKey = "label", yKey = "value" }: any) {
  const chartData = Array.isArray(data) ? data : [];

  return (
    <ChartCard title={title}>
      <ResponsiveContainer width="100%" height="100%">
        <ReAreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <defs>
            <linearGradient id="colorAreaMain" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey={xKey} stroke="#64748b" tick={{ fontSize: 12 }} />
          <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
          <Tooltip content={<DefaultTooltip />} />
          <Legend />
          <Area
            type="monotone"
            dataKey={yKey}
            stroke="#2563eb"
            fill="url(#colorAreaMain)"
            strokeWidth={3}
            name={yKey}
            animationDuration={500}
          />
        </ReAreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function DonutChartC({ title, data, nameKey = "name", valueKey = "value" }: any) {
  const chartData = Array.isArray(data) ? data : [];

  return (
    <ChartCard title={title}>
      <ResponsiveContainer width="100%" height="100%">
        <RePieChart>
          <Tooltip content={<DefaultTooltip />} />
          <Legend />
          <Pie
            data={chartData}
            dataKey={valueKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={3}
            animationDuration={500}
          >
            {chartData.map((_: any, index: number) => (
              <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
        </RePieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}


function LineChartC({ title, data, xKey = "label", yKey = "value" }: any) {
  const chartData = Array.isArray(data) ? data : [];

  return (
    <ChartCard title={title}>
      <ResponsiveContainer width="100%" height="100%">
        <ReLineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey={xKey} stroke="#64748b" tick={{ fontSize: 12 }} />
          <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
          <Tooltip content={<DefaultTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey={yKey}
            stroke="#2563eb"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name={yKey}
            animationDuration={500}
          />
        </ReLineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function StackedBarChartC({
  title,
  data,
  xKey = "label",
  series = [],
}: any) {
  const chartData = Array.isArray(data) ? data : [];
  const chartSeries = Array.isArray(series) ? series : [];

  return (
    <ChartCard title={title}>
      <ResponsiveContainer width="100%" height="100%">
        <ReBarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey={xKey} stroke="#64748b" tick={{ fontSize: 12 }} />
          <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
          <Tooltip content={<DefaultTooltip />} />
          <Legend />
          {chartSeries.map((key: string, index: number) => (
            <Bar
              key={key}
              dataKey={key}
              stackId="total"
              fill={CHART_COLORS[index % CHART_COLORS.length]}
              radius={index === chartSeries.length - 1 ? [8, 8, 0, 0] : [0, 0, 0, 0]}
              animationDuration={500}
            />
          ))}
        </ReBarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}


function BarChartC({ title, labels, values }: any) {
  const lbls = Array.isArray(labels) ? labels : [];
  const vals = Array.isArray(values) ? values : [];

  const data = lbls.map((label: string, i: number) => ({
    label,
    value: Number(vals[i] ?? 0),
  }));

  return (
    <ChartCard title={title} height={Math.max(280, data.length * 48)}>
      <ResponsiveContainer width="100%" height="100%">
        <ReBarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 16, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis type="number" stroke="#64748b" />
          <YAxis
            type="category"
            dataKey="label"
            stroke="#64748b"
            width={140}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<DefaultTooltip />} />
          <Legend />
          <Bar
            dataKey="value"
            name="Value"
            fill="#2563eb"
            radius={[0, 8, 8, 0]}
            animationDuration={500}
          />
        </ReBarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}


function ReportSectionC({ heading, body }: any) {
  const renderMarkdown = (text: string) => {
    if (!text) return null;
    const lines = text.split("\n");
    return lines.map((line: string, i: number) => {
      if (!line.trim()) {
        return <div key={i} style={{ height: 8 }} />;
      }
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <div key={i} style={{ minHeight: 20 }}>
          {parts.map((part: string, j: number) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong key={j} style={{ fontWeight: 700, color: "#0f172a" }}>
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return <span key={j}>{part}</span>;
          })}
        </div>
      );
    });
  };

  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        padding: 20,
        background: "white",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      <h3
        style={{
          marginTop: 0,
          marginBottom: 12,
          fontSize: 18,
          fontWeight: 700,
          color: "#0f172a",
        }}
      >
        {heading}
      </h3>
      <div
        style={{
          fontSize: 14,
          color: "#334155",
          lineHeight: 1.7,
        }}
      >
        {renderMarkdown(body)}
      </div>
    </div>
  );
}

// ─── Component register ───────────────────────────────────────
const registry: Record<string, React.ComponentType<any>> = {
  Stack: StackC,
  Grid: GridC,
  KPICard: KPICardC,
  DataTable: DataTableC,
  BarChart: BarChartC,
  VerticalBarChart: VerticalBarChartC,
  LineChart: LineChartC,
  AreaChart: AreaChartC,
  DonutChart: DonutChartC,
  StackedBarChart: StackedBarChartC,
  ReportSection: ReportSectionC,
};

// ─── Renderer ──────────────────────────────────────────────────
function renderNode(node: OpenUINode): React.ReactNode {
  const Component = registry[node.tag];
  if (!Component) {
    console.warn(`Unknown OpenUI component: ${node.tag}`);
    return null;
  }

  const children = node.children.map((child, i) => {
    const rendered = renderNode(child);
    return rendered ? <React.Fragment key={i}>{rendered}</React.Fragment> : null;
  });

  return <Component {...node.props}>{children}</Component>;
}

export function OpenUIRenderer({ response }: { response: string }) {
  if (!response || !response.trim()) {
    return (
      <div style={{ color: "#64748b", fontSize: 14, padding: 20 }}>
        The generated UI will appear here.
      </div>
    );
  }

  try {
    const tree = parseOpenUI(response);
    if (!tree) {
      return (
        <div style={{ color: "#ef4444", fontSize: 14, padding: 20 }}>
          Failed to parse OpenUI response.
        </div>
      );
    }
    return <div>{renderNode(tree)}</div>;
  } catch (e: any) {
    return (
      <div style={{ color: "#ef4444", fontSize: 14, padding: 20 }}>
        OpenUI parsing error: {e.message}
        <pre
          style={{
            marginTop: 12,
            fontSize: 11,
            color: "#64748b",
            whiteSpace: "pre-wrap",
            background: "#f8fafc",
            padding: 12,
            borderRadius: 8,
          }}
        >
          {response.substring(0, 500)}...
        </pre>
      </div>
    );
  }
}
