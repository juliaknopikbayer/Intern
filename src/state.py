from typing import TypedDict, List, Dict, Optional

class AgentState(TypedDict):
    user_input: str
    is_safe: bool
    error_message: Optional[str]
    response: Optional[str]
    