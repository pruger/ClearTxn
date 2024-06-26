import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { okaidia } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './App.css';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionData: object | null;
  onCopy: () => void;
}

const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, transactionData, onCopy }) => {
  if (!isOpen || !transactionData) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="modal-title">Transaction Data</h2>
        <SyntaxHighlighter language="json" style={okaidia} className="modal-content">
          {JSON.stringify(transactionData, null, 2)}
        </SyntaxHighlighter>
        <div className="modal-actions">
          <button onClick={onCopy} className="bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700">ClearTxn!</button>
          <button onClick={onClose} className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700">Close</button>
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;
