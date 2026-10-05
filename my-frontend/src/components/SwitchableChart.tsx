// import React from "react";

// type ChartType = "barVertical" | "barHorizontal" | "line" | "area" | "donut";

// const CHART_TYPES: { key: ChartType; label: string }[] = [
  // { key: "barVertical", label: "Słupki pionowe" },
  // { key: "barHorizontal", label: "Słupki poziome" },
  // { key: "line", label: "Liniowy" },
  // { key: "area", label: "Obszarowy" },
  // { key: "donut", label: "Kołowy" },
// ];

// export function SwitchableChart({
  // title,
  // labels,
  // values,
  // editable,
  // defaultType = "barVertical",
// }: {
  // title: string;
  // labels: string[];
  // values: number[];
  // editable: boolean;
  // defaultType?: ChartType;
// }) {
  // const [type, setType] = React.useState<ChartType>(defaultType);

  // const lbls = Array.isArray(labels) ? labels : [];
  // const vals = Array.isArray(values) ? values : [];

  // // wspólny format danych dla wykresów label/value
  // const data = lbls.map((label, i) => ({
    // label,
    // name: label,
    // value: Number(vals[i] ?? 0),
  // }));

  // const renderChart = () => {
    // switch (type) {
      // case "barHorizontal":
        // return <BarChartC title="" labels={lbls} values={vals} />;
      // case "line":
        // return <LineChartC title="" data={data} xKey="label" yKey="value" />;
      // case "area":
        // return <AreaChartC title="" data={data} xKey="label" yKey="value" />;
      // case "donut":
        // return <DonutChartC title="" data={data} nameKey="name" valueKey="value" />;
      // case "barVertical":
      // default:
        // return <VerticalBarChartC title="" labels={lbls} values={vals} />;
    // }
  // };

  // return (
    // <ChartCard title={title}>
      // {editable && (
        // <div
          // style={{
            // display: "flex",
            // flexWrap: "wrap",
            // gap: 8,
            // marginBottom: 12,
          // }}
        // >
          // {CHART_TYPES.map((ct) => {
            // const active = ct.key === type;
            // return (
              // <button
                // key={ct.key}
                // onClick={() => setType(ct.key)}
                // style={{
                  // border: active ? "1px solid #2563eb" : "1px solid #bfdbfe",
                  // borderRadius: 999,
                  // background: active ? "#2563eb" : "#eff6ff",
                  // color: active ? "white" : "#2563eb",
                  // padding: "6px 12px",
                  // fontSize: 12,
                  // fontWeight: 700,
                  // cursor: "pointer",
                // }}
              // >
                // {ct.label}
              // </button>
            // );
          // })}
        // </div>
      // )}

      // <div style={{ flex: 1, minHeight: 0 }}>{renderChart()}</div>
    // </ChartCard>
  // );
// }
