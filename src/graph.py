from typing import Literal 
from langgraph.graph import END, START, StateGraph
from langgraph.checkpoint.memory import MemorySaver
from nodes import *
from state import AgentState

def route_after_validation(state:AgentState) -> Literal["next", "blocked"]:
    if state.get("is_user_input_valid"):
        return "next" 
    return "blocked"
    
def route_after_injection_check(state:AgentState) ->Literal["next", "blocked"]:
    if state.get("is_user_input_safe"): 
        return "next"
    return "blocked"
    
def route_generate_sql(state:AgentState) -> Literal["end", "next"]: 
    if state.get("too_many_requests"): 
        return "end"
    return "next"
    
def route_sql_check(state:AgentState) -> Literal["next", "again"]:
    if state.get("is_SQL_select"):
        return "next"
    elif state.get("rejected") is True:
        return "end"
    return "again"  
    
def route_check_correctness(state:AgentState) -> Literal["again", "next"]:
    if state.get("is_SQL_compatible") is False: 
        return "again"
    return "next"
        
def route_after_sql_hitl(state:AgentState) -> Literal["end", "again"]:
    
    if state.get("is_SQL_approved"): 
        return "end"
    return "again"
        
    
builder = StateGraph(AgentState)

builder.add_node("generate_schema", generate_schema_node)
builder.add_node("validate_input", validate_input_node)
builder.add_node("check_injection", check_injection_node)
builder.add_node("blocked", block_input_node)
builder.add_node("generate_sql", generate_sql_node)
builder.add_node("check_sql", check_sql_node)
builder.add_node("print_validate_info", print_validate_info_node)
builder.add_node("check_correctness_sql", check_correctness_sql_node)
builder.add_node("hitl_sql", hitl_sql_node)


builder.add_edge(START, "generate_schema")
builder.add_edge("generate_schema", "validate_input")
builder.add_edge("validate_input", "print_validate_info")

builder.add_conditional_edges(
    "print_validate_info",            #what we do
    route_after_validation,           #determining the path based on the function's return
    {
        "next":"check_injection",        
        "blocked":"blocked"
    }
)  

builder.add_conditional_edges(
    "check_injection", 
    route_after_injection_check,
    {
        "next":"generate_sql",
        "blocked":"blocked"
    }
) 

builder.add_conditional_edges(
    "generate_sql",
    route_generate_sql,
    {   
        "end": END,
        "next":"check_sql"
    }
) 
 
builder.add_conditional_edges(
    "check_sql", 
    route_sql_check,
    {   
        "next": "check_correctness_sql",
        "again":"generate_sql",
        "end": END
    }
) 
 
builder.add_conditional_edges(
    "check_correctness_sql", 
    route_check_correctness,
    {   
        "next": "hitl_sql",
        "again":"generate_sql",
    }
) 
 

builder.add_conditional_edges(
    "hitl_sql", 
    route_after_sql_hitl,
    {   
        "end": END,
        "again":"generate_sql",
    }
)
 

builder.add_edge("blocked",END)


graph = builder.compile()