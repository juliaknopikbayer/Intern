from typing import List, Literal, Optional, Union
from pydantic import BaseModel, Field


class KPICardData(BaseModel):
    widget_type: Literal["kpi_card"] = "kpi_card"
    title: str
    value: str
    subtitle: Optional[str] = None
    trend: Optional[str] = None


class BarChartWidgetData(BaseModel):
    widget_type: Literal["chart"] = "chart"
    chart_type: Literal["bar", "vertical_bar"]
    title: str
    labels: List[str]
    values: List[float]


class LineAreaChartWidgetData(BaseModel):
    widget_type: Literal["chart"] = "chart"
    chart_type: Literal["line", "area"]
    title: str
    data: List[dict]
    xKey: str
    yKey: str


class DonutChartWidgetData(BaseModel):
    widget_type: Literal["chart"] = "chart"
    chart_type: Literal["donut"]
    title: str
    data: List[dict]
    nameKey: str
    valueKey: str


class StackedBarChartWidgetData(BaseModel):
    widget_type: Literal["chart"] = "chart"
    chart_type: Literal["stacked_bar"]
    title: str
    data: List[dict]
    xKey: str
    series: List[str]


class TableWidgetData(BaseModel):
    widget_type: Literal["table"] = "table"
    title: str
    columns: List[str]
    rows: List[List[str]]


class ReportWidgetData(BaseModel):
    widget_type: Literal["report"] = "report"
    title: str
    content: str


class GenerativeUIResponse(BaseModel):
    widgets: List[
        Union[
            KPICardData,
            BarChartWidgetData,
            LineAreaChartWidgetData,
            DonutChartWidgetData,
            StackedBarChartWidgetData,
            TableWidgetData,
            ReportWidgetData,
        ]
    ]

