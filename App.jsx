import React, { useState } from 'react';
import InterpreterPortal from './InterpreterPortal';
import AdminCRM from './AdminCRM';

export default function App() {
  const [mode, setMode] = useState('interpreter'); // 'interpreter' or 'admin'

  return (
    <div>
      {/* Optional: Add mode switcher */}
      {/* <button onClick={() => setMode(mode === 'interpreter' ? 'admin' : 'interpreter')}>
        Switch to {mode === 'interpreter' ? 'Admin' : 'Interpreter'}
      </button> */}
      
      {mode === 'interpreter' ? <InterpreterPortal /> : <AdminCRM />}
    </div>
  );
}