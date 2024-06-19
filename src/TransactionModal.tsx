import React from 'react';
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
          <pre className="modal-content">{JSON.stringify(transactionData, null, 2)}</pre>
          <div className="modal-actions">
            <button onClick={onCopy} className="modal-button copy-button">Copy Data</button>
            <button onClick={onClose} className="modal-button close-button">Close</button>
          </div>
        </div>
      </div>
    );
  };
  
  export default TransactionModal;