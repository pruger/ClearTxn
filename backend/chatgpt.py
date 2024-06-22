import requests
import os

def get_chatgpt_response(transaction_data, model="gpt-4"):
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {os.environ.get("OPENAI_API_KEY")}",
        "Content-Type": "application/json"
    }
    prompt = f"""I did simulate a transaction on starknet.
    Give me an overview of what this transaction would do if I were to execute it.
    Do not go over each step individually but give me a short overview. 
    If there was a transfer tell me how many tokens were transferred and to whom.
    If there wan't a transfer just tell me no tokens have been transferred.
    Don't tell me there was no transfer.
    Give me an example in what context such a transaction might be executed.
    Do not tell me to give you more information rather make an educated guess.

    This is the output of the simulation:
    
    {transaction_data}
    """
    data = {
        "model": model,
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": str(prompt)}
        ],
        "max_tokens": 600
    }
    
    response = requests.post(url, headers=headers, json=data)
    
    if response.status_code == 200:
        return response.json()['choices'][0]['message']['content']
    else:
        raise Exception(f"Request failed with status code {response.status_code}: {response.text}")
