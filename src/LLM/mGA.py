from openai import OpenAI
from config import * 
import os
import httpx
import urllib3
import requests

# os.environ["NO_PROXY"] = "chat.int.bayer.com"
# Wyłącz ostrzeżenia o weryfikacji SSL (potrzebne przy korporacyjnym proxy)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

API_KEY    = API_KEY
BASE_URL   = BASE_URL   
MODEL_NAME = "claude-sonnet-4.5"  
BASE_URL_IP = "https://63.186.26.61/api/v2"                              # or gpt-4o-mini, claude-sonnet-4.5, etc.

# client = OpenAI(
    # api_key=API_KEY,
    # base_url=BASE_URL,
    # http_client=httpx.Client(trust_env=False),
# )

def chat(prompt: str, system: str = "You are a helpful assistant.") -> str:
    url = f"{BASE_URL_IP}/chat/completions"
    
    response = requests.post(
        url,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
            "Host": "chat.int.bayer.com"  
        },
        json={
            "model": MODEL_NAME,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user",   "content": prompt},
            ],
            "temperature": 0.0,
        },
        timeout=60,
        verify=False,  
    )
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"]

# # --- Basic chat completion ---
# def chat(prompt: str, system: str = "You are a helpful assistant.") -> str:
    # response = client.chat.completions.create(
        # model=MODEL_NAME,
        # messages=[
            # {"role": "system", "content": system},
            # {"role": "user",   "content": prompt},
        # ],
        # temperature=0.0,
    # )
    # return response.choices[0].message.content


# # --- Multi-turn conversation ---
# def chat_multi_turn(messages: list[dict]) -> str:
    # """Pass a full message history: [{"role": "user", "content": "..."}, ...]"""
    # response = client.chat.completions.create(
        # model=MODEL_NAME,
        # messages=messages,
        # temperature=0.7,
    # )
    # return response.choices[0].message.content


# # --- Streaming response ---
# def chat_stream(prompt: str, system: str = "You are a helpful assistant."):
    # stream = client.chat.completions.create(
        # model=MODEL_NAME,
        # messages=[
            # {"role": "system", "content": system},
            # {"role": "user",   "content": prompt},
        # ],
        # temperature=0.7,
        # stream=True,
    # )
    # for chunk in stream:
        # delta = chunk.choices[0].delta.content
        # if delta:
            # print(delta, end="", flush=True)
            
            

