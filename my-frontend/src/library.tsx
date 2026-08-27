import React from "react";
import { createLibrary, defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

const Stack = defineComponent({
  name: "Stack",
  description: "Vertical stack layout",
  props: z.object({}),
  component: ({ children }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {children}
    </div>
  ),
});

const Grid = defineComponent({
  name: "Grid",
  description: "Responsive grid layout",
  props: z.object({
    columns: z.union([z.string(), z.number()]),
  }),
  component: ({ columns, children }) => {
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
  },
});

const KPICard = defineComponent({
  name: "KPICard",
  description: "A KPI card with title, value and optional subtitle",
  props: z.object({
    title: z.string(),
    value: z.string(),
    subtitle: z.string().optional(),
  }),
  component: ({ title, value, subtitle }) => (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        padding: 16,
        background: "white",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ fontSize: 14, color: "#64748b", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "#0f172a" }}>{value}</div>
      {subtitle ? (
        <div style={{ fontSize: 14, color: "#475569", marginTop: 8 }}>{subtitle}</div>
      ) : null}
    </div>
  ),
});

const DataTable = defineComponent({
  name: "DataTable",
  description: "Tabular data display",
  props: z.object({
    title: z.string().optional(),
    columns: z.array(z.string()),
    rows: z.array(z.array(z.string())),
  }),
  component: ({ title, columns, rows }) => (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        background: "white",
        overflow: "hidden",
      }}
    >
      {title ? (
        <div
          style={{
            padding: 16,
            borderBottom: "1px solid #e2e8f0",
            fontWeight: 600,
            color: "#0f172a",
          }}
        >
          {title}
        </div>
      ) : null}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead style={{ background: "#f8fafc" }}>
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  style={{
                    textAlign: "left",
                    padding: 12,
                    borderBottom: "1px solid #e2e8f0",
                    color: "#475569",
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    style={{
                      padding: 12,
                      borderBottom: "1px solid #f1f5f9",
                      color: "#0f172a",
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  ),
});

const ReportSection = defineComponent({
  name: "ReportSection",
  description: "Narrative report section",
  props: z.object({
    heading: z.string(),
    body: z.string(),
  }),
  component: ({ heading, body }) => (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        padding: 16,
        background: "white",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 12, color: "#0f172a" }}>{heading}</h3>
      <div
        style={{
          whiteSpace: "pre-wrap",
          color: "#334155",
          lineHeight: 1.6,
          fontSize: 14,
        }}
      >
        {body}
      </div>
    </div>
  ),
});

export const library = createLibrary({
  components: [Stack, Grid, KPICard, DataTable, ReportSection],
  root: "Stack",
});
