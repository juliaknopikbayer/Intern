from typing import TypedDict, List, Dict, Optional, Any, Annotated
import operator

class AgentState(TypedDict):
    user_input: str
    SQL_query: str
    SQL_queries: list[str]
    schema: str
    
    first_generation_call: bool
    
    is_user_input_valid: bool
    is_user_input_safe: bool
    
    error_message: Optional[str]
    response: Optional[str]
    
    is_SQL_select: bool       
    is_SQL_compatible:bool
    is_SQL_approved: bool
    empty_output: bool 
    data_conn_fail:bool
    
    retry_count_check_select: int
    retry_count_check_correctness: int
    retry_count_hitl: int
    retry_count_empty_output: int
    retry_count_no_data_conn: int
    

    too_many_requests: bool
    rejected: bool 
    
    query_result: Optional[List[Dict[str,Any]]]
    
    masked_data: str 
    pii_mapping: Dict[str,str]
    
    openui_response: str
    logs: list
    subqueries: list
    
     # HITL
    hitl_explanation: str
    user_decision: str   # "accept" | "reject"
    
    
    
    #storage
    user_id: str                          # NOWE: identyfikator właściciela dashboardu
    saved_dashboard_id: Optional[int]     # NOWE: ID zapisanego dashboardu
    
    
    
  