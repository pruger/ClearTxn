import React, { useState, useEffect } from 'react';
import TransactionModal from './TransactionModal';
import { backend } from './config';
import './App.css';

declare const require: {
  context: (path: string, deep?: boolean, filter?: RegExp) => {
    keys: () => string[];
    <T>(id: string): T;
  };
};

const ClearTxn: React.FC = () => {
  const [transaction, setTransaction] = useState('');
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
    if (transaction) {
      setLoading(true);
      setResult('<div class="spinner"></div>');
      try {
        const response = await fetch(`${backend}/simulate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
          },
          body: transaction
        });

        const data = await response.json();
        setResult(`
          <div class="bg-gray-800 p-6 rounded shadow-md">
            <h2 class="text-xl font-bold text-teal-400">Transaction Explanation:</h2>
            <pre class="bg-gray-900 p-4 rounded mt-4 text-white whitespace-pre-wrap">${data['message']}</pre>
          </div>
        `);
      } catch (error: any) {
        console.error('Error:', error);
        setResult(`<p class="text-red-500">Error: ${error.message}</p>`);
      } finally {
        setLoading(false);
      }
    } else {
      alert('Please enter a transaction');
    }
  };

  const handleOpenModal = (data: object) => {
    setTransactionData(data);
    setIsModalOpen(true);
  };

  const handleCopyData = () => {
    if (transactionData) {
      setTransaction(JSON.stringify(transactionData, null, 2));
      setIsModalOpen(false);
    }
  };

  return (
    <div className="clear-txn-container">
      <div className="transaction-explainer">
        <div className="input-section">
          <label htmlFor="transaction" className="block text-sm font-medium text-gray-400">Transaction:</label>
          <textarea
            id="transaction"
            value={transaction}
            onChange={(e) => setTransaction(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-white sm:text-sm"
            placeholder="Enter transaction"
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
