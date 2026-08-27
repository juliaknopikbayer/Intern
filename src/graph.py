from typing import Literal 
from langgraph.graph import END, START, StateGraph
from langgraph.checkpoint.memory import MemorySaver
from nodes import *
from state import AgentState
from langgraph.checkpoint.memory import MemorySaver

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
    elif state.get("rejected"):
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
    
def route_after_DB_connection(state: AgentState) -> Literal["end", "again", "next"]:
    error_message = (state.get("error_message") or "").lower().strip()

    if error_message:
        # Błędy krytyczne 
        critical_markers = [
            "no such table",
            "unable to open database file",
            "database is locked",
            "disk i/o error",
            "permission denied",
            "access denied",
            "malformed database",
            "file is not a database",
            "readonly database",
            "out of memory",
            "syntax error near",
        ]

        for marker in critical_markers:
            if marker in error_message:
                return "end"

        # Błędy naprawialne 
        retryable_markers = [
            "no such column",
            "ambiguous column name",
            "syntax error",
            "datatype mismatch",
            "type mismatch",
            "misuse of aggregate",
            "wrong number of arguments",
            "no such function",
            "has no column named",
            "cannot join",
            "group by",
        ]

        for marker in retryable_markers:
            if marker in error_message:
                if state.get("retry_count_no_data_conn", 0) < 3:
                    return "again"
                return "end"
        return "end"

    if state.get("empty_output") is True:
        if state.get("retry_count_empty_output", 0) < 3:
            return "again"
        return "end"
    return "next"

        
    
builder = StateGraph(AgentState)

builder.add_node("generate_schema", generate_schema_node)
builder.add_node("validate_input", validate_input_node)
builder.add_node("check_injection", check_injection_node)
builder.add_node("blocked", block_input_node)
builder.add_node("generate_sql", generate_sql_node)
builder.add_node("check_sql", check_sql_node)
builder.add_node("check_correctness_sql", check_correctness_sql_node)
# builder.add_node("hitl_sql", hitl_sql_node)
builder.add_node("execute_sql_query", execute_sql_query_node)
builder.add_node("anonymize_reversible", anonymize_reversible_node)
builder.add_node("gen_openui", gen_openui_node)
builder.add_node("deanonymize_openui", deanonymize_openui_node)
builder.add_node("error", error_node)
#builder.add_node("question_decomposition", question_decomposition_node)


builder.add_edge(START, "generate_schema")
builder.add_edge("generate_schema", "validate_input")
builder.add_edge("validate_input", "check_injection")
# builder.add_edge("check_injection", "question_decomposition")



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
        "next":  "execute_sql_query",
        "again":"generate_sql",
    }
) 
 

# builder.add_conditional_edges(
    # "hitl_sql", 
    # route_after_sql_hitl,
    # {   
        # "end": "execute_sql_query",
        # "again":"generate_sql",
    # }
# )

builder.add_conditional_edges(
    "execute_sql_query", 
    route_after_DB_connection,
    {   
        "end": "error",
        "again": "generate_sql",
        "next": "anonymize_reversible"
    }
) 
builder.add_edge("anonymize_reversible", "gen_openui")
builder.add_edge("gen_openui", "deanonymize_openui")
builder.add_edge("deanonymize_openui", END)
builder.add_edge("blocked",END)


# graph = builder.compile()
memory = MemorySaver()
graph = builder.compile(checkpointer=memory)