from state import AgentState 
from transformers import pipeline, AutoTokenizer,AutoModelForSequenceClassification
import os
import logging


GUARD_MODEL_NAME: str = r"./Prompt_injection_model"
SAFETY_THRESHOLD: float = float(os.getenv("SAFETY_THRESHOLD", "0.80"))  #If model thinks in 80% its injection then throws error


logger = logging.getLogger(__name__) 
logger.info("")

tokenizer = AutoTokenizer.from_pretrained(GUARD_MODEL_NAME, local_files_only=True)
model = AutoModelForSequenceClassification.from_pretrained(GUARD_MODEL_NAME, local_files_only=True)

guard_pipeline = pipeline( 
    "text-classification", 
    model = model,
    tokenizer=tokenizer,
    )

MAX_LENGTH = 4000
def validate_input_node(state:AgentState) -> dict: 
    user_input = state.get("user_input","") 
    cleaned_input = user_input.strip() if user_input else "" 
    
    if not cleaned_input: 
        return {
            "user_input": user_input,
            "is_safe":False, 
            "error_message":"The prompt can't be empty." ,
        }
        
    if len(cleaned_input) < 3:
        return{ 
            "user_input": user_input,
            "is_safe":False, 
            "error_message":"The prompt is too short" ,
        }
    if len(cleaned_input) > MAX_LENGTH: 
        return{
            "user_input": user_input,
            "is_safe":False, 
            "error_message":"The prompt is too long" ,
        }
    
    
    print(
            f"Prompt format is OK"
        )
    return{
        
        "user_input": cleaned_input,
        "is_safe":True, 
        "error_message":None,
    }


def check_injection_node(state: AgentState) ->  dict:
    user_input = state.get("user_input","") 
    results = guard_pipeline(user_input)
    predictions = results[0]
    
    label = str(predictions["label"]).upper()    #output: injection or safe
    score = float(predictions["score"])   #certainty
    
    if "0" in label: 
        label = "SAFE"
    else: 
        label="INJECTION"
    
    print(f"The model gave a verdict: opinion={label}, probability={score:.4f}")
    
    is_injection = (
        label in ["INJECTION", "LABEL_1"] and score >= SAFETY_THRESHOLD 
        )
    
    if is_injection: 
        logger.warning(f"\033[91m Threat detected! \033[0m")
        return{
        "user_input": user_input,
        "is_safe":False, 
        "error_message":"Request rejected for security reasons" 
        }
    else:
        print(f"\033[92m Everything OK! \033[0m")
        return {
            "user_input": user_input,
            "is_safe":True, 
            "error_message": None
        }
    
def block_input_node(state: AgentState) -> dict: 
    return { 
        "response": state.get(
            "error_message","Prompt blocked")
    }
    
def main_agent_node(state: AgentState) -> dict: 
    user_input = state.get("user_input")
    return { 
        "response": f"This correct prompt will be processed further: '{user_input}'"
    }