
import React from 'react';
import ReactDOM from 'react-dom/client';
// FIX: Ensure App is correctly imported as a module. This error resolves once App.tsx is a valid module.
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
