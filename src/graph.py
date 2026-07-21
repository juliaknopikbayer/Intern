from typing import Literal 
from langgraph.graph import END, START, StateGraph
from nodes import *
from state import AgentState

def route_after_validation(state:AgentState) -> Literal["continue", "blocked"]:
    if state.get("is_safe", False):
        return "continue" 
    return "blocked"
    
builder = StateGraph(AgentState)

builder.add_node("validate_input", validate_input_node)
builder.add_node("check_injection", check_injection_node)
builder.add_node("agent", main_agent_node)
builder.add_node("blocked", block_input_node)

builder.add_edge(START, "validate_input")

builder.add_conditional_edges(
    "validate_input", 
    route_after_validation,
    {
        "continue":"check_injection",
        "blocked":"blocked"
    }
 )  

builder.add_conditional_edges(
    "check_injection", 
    route_after_validation,
    {
        "continue":"agent",
        "blocked":"blocked"
    }
 )   
builder.add_edge("agent", END)
builder.add_edge("blocked",END)

graph = builder.compile()