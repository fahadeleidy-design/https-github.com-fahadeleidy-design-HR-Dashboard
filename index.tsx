import React, { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
// FIX: Use a named import for the App component as it is not a default export.
import { App } from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);