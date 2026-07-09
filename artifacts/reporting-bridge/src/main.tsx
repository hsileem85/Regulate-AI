import React from 'react';
import { App } from './App'; // Import the App component
import { createRoot } from 'react-dom/client';
import './index.css';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<App />);
}
