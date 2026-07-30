from typing import TypedDict, List, Dict, Optional

class AgentState(TypedDict):
    user_input: str
    SQL_query: str
    schema: str
    
    first_generation_call: bool
    
    is_user_input_valid: bool
    is_user_input_safe: bool
    
    error_message: Optional[str]
    response: Optional[str]
    
    is_SQL_select: bool       
    is_SQL_compatible:bool
    is_SQL_approved: bool
    
    retry_count_check_select: int
    retry_count_check_correctness: int
    retry_count_hitl: int
    
    too_many_requests: bool
    rejected: bool 
    
    
    
  