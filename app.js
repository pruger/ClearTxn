document.getElementById('explain-btn').addEventListener('click', async () => {
    const transactionHash = document.getElementById('transaction-hash').value;
    if (transactionHash) {
      const resultDiv = document.getElementById('result');
      resultDiv.innerHTML = '<div class="spinner"></div>';
  
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer sk-proj-xxxxxxxxxxxxxx`  // Replace with your actual OPENAI API key
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [
              { role: 'system', content: 'You are a helpful assistant. Pretend we are using Starknet but use ethereum' },
              { role: 'user', content: `Explain the Etherum transaction in a brief summary. not more than 300 characters : ${transactionHash}` }
            ],
            max_tokens: 600
          })
        });
  
        const data = await response.json();
        const explanation = data.choices[0].message.content.trim();
        console.log('Full API response:', data);
        resultDiv.innerHTML = `
          <div class="bg-gray-800 p-6 rounded shadow-md">
            <h2 class="text-xl font-bold text-teal-400">Transaction Explanation:</h2>
            <pre class="bg-gray-900 p-4 rounded mt-4 text-white whitespace-pre-wrap">${explanation}</pre>
          </div>`;
      } catch (error) {
        console.error('Error:', error);
        resultDiv.innerHTML = `<p class="text-red-500">Error: ${error.message}</p>`;
      }
    } else {
      alert('Please enter a transaction hash');
    }
  });
  
  

  