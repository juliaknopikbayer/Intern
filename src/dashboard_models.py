from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class DashboardSaveRequest(BaseModel):
    user_id: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1, max_length=255)
    user_input: str
    sql_queries: List[str] = []
    schema_text: str = ""
    masked_data: str = ""
    pii_mapping: Dict[str, str] = {}
    openui_response: str
    layout_nodes: Optional[List[Dict[str, Any]]] = None


class DashboardUpdateRequest(BaseModel):
    user_id: str = Field(..., min_length=1)
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    openui_response: Optional[str] = None
    sql_queries: Optional[List[str]] = None
    schema_text: Optional[str] = None
    masked_data: Optional[str] = None
    pii_mapping: Optional[Dict[str, str]] = None
    # None means "do not change layout". [] means "save an empty dashboard".
    layout_nodes: Optional[List[Dict[str, Any]]] = None


class DashboardListItem(BaseModel):
    id: int
    owner_id: str
    name: str
    user_input: str
    created_at: str
    updated_at: str


class DashboardResponse(BaseModel):
    id: int
    owner_id: str
    name: str
    user_input: str
    sql_queries: List[str]
    schema_text: str
    masked_data: str
    pii_mapping: Dict[str, str]
    openui_response: str
    layout_nodes: Optional[List[Dict[str, Any]]] = None
    created_at: str
    updated_at: str


class DashboardListResponse(BaseModel):
    items: List[DashboardListItem]
    limit: int
    offset: int


class UserRequestWithUser(BaseModel):
    message: str
    user_id: str = Field(..., min_length=1)


class ResumeRequest(BaseModel):
    thread_id: str
    decision: str


class DeleteDashboardResponse(BaseModel):
    deleted: bool
    dashboard_id: int


class AgentDonePayload(BaseModel):
    openui_response: str = ""
    sql_queries: List[str] = []
    schema_text: str = ""
    masked_data: str = ""
    pii_mapping: Dict[str, str] = {}
    user_input: str = ""
    dashboard_savable: bool = True
