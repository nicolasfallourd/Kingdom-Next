import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { debug, supabaseSchema } from '../lib/debug';

export default function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState('Checking...');
  const [authStatus, setAuthStatus] = useState('Checking...');
  const [gameStateTable, setGameStateTable] = useState('Checking...');
  const [warReportsTable, setWarReportsTable] = useState('Checking...');
  const [currentUser, setCurrentUser] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Check Supabase connection
    checkSupabaseConnection();
    
    // Check auth status
    checkAuthStatus();
    
    // Check tables
    checkTables();
    
    // Set up log capture
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    console.log = function() {
      const args = Array.from(arguments);
      setLogs(prev => [...prev, { type: 'log', message: args.join(' '), timestamp: new Date() }].slice(-50));
      originalConsoleLog.apply(console, args);
    };
    
    console.error = function() {
      const args = Array.from(arguments);
      setLogs(prev => [...prev, { type: 'error', message: args.join(' '), timestamp: new Date() }].slice(-50));
      originalConsoleError.apply(console, args);
    };
    
    console.warn = function() {
      const args = Array.from(arguments);
      setLogs(prev => [...prev, { type: 'warn', message: args.join(' '), timestamp: new Date() }].slice(-50));
      originalConsoleWarn.apply(console, args);
    };
    
    return () => {
      // Restore original console methods
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);
  
  const checkSupabaseConnection = async () => {
    try {
      const { data, error } = await supabase.from('game_states').select('count').limit(1);
      if (error) {
        setDbStatus(`Error: ${error.message}`);
      } else {
        setDbStatus('Connected');
      }
    } catch (error) {
      setDbStatus(`Error: ${error.message}`);
    }
  };
  
  const checkAuthStatus = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setAuthStatus(`Error: ${error.message}`);
      } else if (data.session) {
        setAuthStatus('Authenticated');
        setCurrentUser(data.session.user);
      } else {
        setAuthStatus('Not authenticated');
      }
    } catch (error) {
      setAuthStatus(`Error: ${error.message}`);
    }
  };
  
  const checkTables = async () => {
    try {
      // Check game_states table
      const { data: gameStatesData, error: gameStatesError } = await supabase
        .from('game_states')
        .select('*')
        .limit(1);
        
      if (gameStatesError) {
        setGameStateTable(`Error: ${gameStatesError.message}`);
      } else {
        setGameStateTable(`OK (${gameStatesData.length} rows sampled)`);
      }
      
      // Check war_reports table
      const { data: warReportsData, error: warReportsError } = await supabase
        .from('war_reports')
        .select('*')
        .limit(1);
        
      if (warReportsError) {
        setWarReportsTable(`Error: ${warReportsError.message}`);
      } else {
        setWarReportsTable(`OK (${warReportsData.length} rows sampled)`);
      }
    } catch (error) {
      setGameStateTable(`Error: ${error.message}`);
      setWarReportsTable(`Error: ${error.message}`);
    }
  };
  
  const clearGameState = async () => {
    if (!currentUser) return;
    
    try {
      const { error } = await supabase
        .from('game_states')
        .delete()
        .eq('id', currentUser.id);
        
      if (error) {
        console.error('Failed to clear game state:', error);
      } else {
        console.log('Game state cleared successfully');
        // Reload the page
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to clear game state:', error);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          zIndex: 9999,
          padding: '5px 10px',
          border: '1px solid black',
          background: 'white',
          fontFamily: 'monospace',
          fontSize: '12px',
          cursor: 'pointer'
        }}
      >
        Debug
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        width: '400px',
        maxHeight: '80vh',
        overflowY: 'auto',
        zIndex: 9999,
        padding: '10px',
        border: '1px solid black',
        background: 'white',
        fontFamily: 'monospace',
        fontSize: '12px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h3 style={{ margin: 0 }}>Debug Panel</h3>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            border: '1px solid black',
            background: 'white',
            cursor: 'pointer',
            padding: '2px 5px'
          }}
        >
          Close
        </button>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <h4 style={{ margin: '5px 0' }}>Supabase Status</h4>
        <div>Database: <span style={{ color: dbStatus === 'Connected' ? 'green' : 'red' }}>{dbStatus}</span></div>
        <div>Auth: <span style={{ color: authStatus === 'Authenticated' ? 'green' : 'red' }}>{authStatus}</span></div>
        <div>game_states table: <span style={{ color: gameStateTable.startsWith('OK') ? 'green' : 'red' }}>{gameStateTable}</span></div>
        <div>war_reports table: <span style={{ color: warReportsTable.startsWith('OK') ? 'green' : 'red' }}>{warReportsTable}</span></div>
      </div>
      
      {currentUser && (
        <div style={{ marginBottom: '10px' }}>
          <h4 style={{ margin: '5px 0' }}>Current User</h4>
          <div>ID: {currentUser.id}</div>
          <div>Email: {currentUser.email}</div>
          <div>Created: {new Date(currentUser.created_at).toLocaleString()}</div>
        </div>
      )}
      
      <div style={{ marginBottom: '10px' }}>
        <h4 style={{ margin: '5px 0' }}>Database Schema</h4>
        <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ccc', padding: '5px' }}>
          <pre>{JSON.stringify(supabaseSchema, null, 2)}</pre>
        </div>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <h4 style={{ margin: '5px 0' }}>Actions</h4>
        <button
          onClick={checkSupabaseConnection}
          style={{
            marginRight: '5px',
            border: '1px solid black',
            background: 'white',
            cursor: 'pointer',
            padding: '5px'
          }}
        >
          Check Connection
        </button>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginRight: '5px',
            border: '1px solid black',
            background: 'white',
            cursor: 'pointer',
            padding: '5px'
          }}
        >
          Reload Page
        </button>
        <button
          onClick={clearGameState}
          style={{
            border: '1px solid black',
            background: 'white',
            cursor: 'pointer',
            padding: '5px'
          }}
        >
          Clear Game State
        </button>
      </div>
      
      <div>
        <h4 style={{ margin: '5px 0' }}>Console Logs</h4>
        <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ccc', padding: '5px' }}>
          {logs.map((log, index) => (
            <div key={index} style={{ 
              color: log.type === 'error' ? 'red' : log.type === 'warn' ? 'orange' : 'black',
              marginBottom: '2px',
              fontSize: '10px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {log.timestamp.toLocaleTimeString()}: {log.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
