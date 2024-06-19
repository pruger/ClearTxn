import React from 'react';
import ClearTxn from './ClearTxn';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="App">
      <header className="App-header">
        <h1 className="app-headline">ClearTxn 🔎</h1>
        <p className="app-summary">A simple tool to explain Starknet transactions by providing a brief summary. Enter a transaction hash to get started, or select a sample transaction data below.</p>
      </header>
      <main className="app-main">
        <ClearTxn />
      </main>
      <footer className="App-footer">
        <p>&copy; 2024 ClearTxn. Made for 🚀 StackHack 2024</p>
      </footer>
    </div>
  );
};

export default App;
