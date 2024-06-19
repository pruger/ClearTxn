import React, { useState, useEffect } from 'react';
import TransactionModal from './TransactionModal';
import './App.css';

declare const require: {
  context: (path: string, deep?: boolean, filter?: RegExp) => {
    keys: () => string[];
    <T>(id: string): T;
  };
};

const ClearTxn: React.FC = () => {
  const [transactionHash, setTransactionHash] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionData, setTransactionData] = useState<object | null>(null);
  const [jsonFiles, setJsonFiles] = useState<{ [key: string]: object }>({});

  useEffect(() => {
    const importAll = (r: ReturnType<typeof require.context>) => {
      let files: { [key: string]: object } = {};
      r.keys().forEach((item: string) => {
        const fileName = item.replace('./', '');
        files[fileName] = r(item);
      });
      return files;
    };

    const jsonFiles = importAll(require.context('./data', false, /\.json$/));
    setJsonFiles(jsonFiles);
  }, []);

  const explainTransaction = async () => {
    if (transactionHash) {
      setLoading(true);
      setResult('<div class="spinner"></div>');
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [
              { role: 'system', content: 'You are a helpful assistant. Pretend we are using Starknet but use ethereum' },
              { role: 'user', content: `Explain the Ethereum transaction in a brief summary. not more than 300 characters: ${transactionHash}` }
            ],
            max_tokens: 600
          })
        });

        const data = await response.json();
        const explanation = data.choices[0].message.content.trim();
        setResult(`
          <div class="bg-gray-800 p-6 rounded shadow-md">
            <h2 class="text-xl font-bold text-teal-400">Transaction Explanation:</h2>
            <pre class="bg-gray-900 p-4 rounded mt-4 text-white whitespace-pre-wrap">${explanation}</pre>
          </div>
        `);
      } catch (error: any) {
        console.error('Error:', error);
        setResult(`<p class="text-red-500">Error: ${error.message}</p>`);
      } finally {
        setLoading(false);
      }
    } else {
      alert('Please enter a transaction hash');
    }
  };

  const handleOpenModal = (data: object) => {
    setTransactionData(data);
    setIsModalOpen(true);
  };

  const handleCopyData = () => {
    if (transactionData) {
      setTransactionHash(JSON.stringify(transactionData, null, 2));
      setIsModalOpen(false);
    }
  };

  return (
    <div className="clear-txn-container">
      <div className="transaction-explainer">
        <div className="input-section">
          <label htmlFor="transaction-hash" className="block text-sm font-medium text-gray-400">Transaction Hash:</label>
          <textarea
            id="transaction-hash"
            value={transactionHash}
            onChange={(e) => setTransactionHash(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-white sm:text-sm"
            placeholder="Enter transaction hash"
            rows={20}
            style={{ resize: 'none' }}
          />
          <button
            onClick={explainTransaction}
            className="mt-4 w-full bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700"
            disabled={loading}
          >
            {loading ? 'Explaining...' : 'Explain Transaction'}
          </button>
        </div>
        <div id="result" className="result-section mt-6" dangerouslySetInnerHTML={{ __html: result }}></div>
      </div>
      <div className="transaction-data-section mt-8">
        <h2 className="text-xl font-bold text-teal-400">Example Transactions</h2>
        <div className="transaction-data-buttons mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Object.keys(jsonFiles).map((fileName, index) => (
            <button
              key={index}
              onClick={() => handleOpenModal(jsonFiles[fileName])}
              className="bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700"
            >
              {fileName.slice(0, -5)}
            </button>
          ))}
        </div>
      </div>
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        transactionData={transactionData}
        onCopy={handleCopyData}
      />
    </div>
  );
};

export default ClearTxn;
