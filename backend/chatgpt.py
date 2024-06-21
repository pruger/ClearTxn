import requests
import os

def get_chatgpt_response(transaction_data, model="gpt-4"):
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {os.environ.get("OPENAI_API_KEY")}",
        "Content-Type": "application/json"
    }
    prompt = f"""I did run a transaction on starknet. 
    Can you give me a really short idea of what this transaction for example could have done with a concrete example. 
    Do not explain the events in detail!
    This is the output of the transaction:
    
    {transaction_data}
    """
    data = {
        "model": model,
        "messages": [
            {"role": "system", "content": "You are a starknet transaction analyser. Helping users understand what a transaction does on starknet before its getting executed."},
            {"role": "user", "content": str(prompt)}
        ],
        "max_tokens": 10
    }
    
    response = requests.post(url, headers=headers, json=data)
    
    if response.status_code == 200:
        return response.json()['choices'][0]['message']['content']
    else:
        raise Exception(f"Request failed with status code {response.status_code}: {response.text}")
