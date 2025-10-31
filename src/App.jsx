import React, { useState } from 'react';
// import InterpreterPortal from './InterpreterPortal';
// import AdminCRM from './AdminCRM';

export default function App() {
  const [mode, setMode] = useState('interpreter'); // 'interpreter' or 'admin'

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>Curalingo Portal</h1>
      <p>Welcome! This is a placeholder React app for Firebase deployment.</p>
      <p>You can add InterpreterPortal and AdminCRM components later.</p>
    </div>
  );
}
