import React, { useState, useEffect } from 'react';
import { debug } from '../lib/debug';

export default function LoadingScreen({ message = 'Loading your kingdom...' }) {
  const [dots, setDots] = useState('');
  const [loadTime, setLoadTime] = useState(0);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState([]);
  const [forceDebug, setForceDebug] = useState(false);

  useEffect(() => {
    // Force debug mode after 3 seconds
    const forceDebugTimeout = setTimeout(() => {
      setForceDebug(true);
      setShowDebugInfo(true);
      console.log('*** KINGDOM DEBUG: Force debug mode activated ***');
    }, 3000);
    
    debug.log('LoadingScreen', 'Loading screen mounted', { message });
    console.log('*** KINGDOM DEBUG: LoadingScreen mounted ***');
    
    // Animate the loading dots
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length < 3 ? prev + '.' : '');
    }, 500);
    
    // Track loading time
    const loadTimeInterval = setInterval(() => {
      setLoadTime(prev => prev + 1);
    }, 1000);
    
    // Capture console output
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    console.log = function() {
      const args = Array.from(arguments);
      const message = args.join(' ');
      if (message.includes('KINGDOM DEBUG')) {
        setConsoleOutput(prev => [...prev.slice(-19), message]);
      }
      originalConsoleLog.apply(console, args);
    };
    
    console.error = function() {
      const args = Array.from(arguments);
      const message = args.join(' ');
      if (message.includes('KINGDOM DEBUG')) {
        setConsoleOutput(prev => [...prev.slice(-19), `ERROR: ${message}`]);
      }
      originalConsoleError.apply(console, args);
    };
    
    console.warn = function() {
      const args = Array.from(arguments);
      const message = args.join(' ');
      if (message.includes('KINGDOM DEBUG')) {
        setConsoleOutput(prev => [...prev.slice(-19), `WARN: ${message}`]);
      }
      originalConsoleWarn.apply(console, args);
    };
    
    return () => {
      clearInterval(dotsInterval);
      clearInterval(loadTimeInterval);
      clearTimeout(forceDebugTimeout);
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      debug.log('LoadingScreen', 'Loading screen unmounted');
      console.log('*** KINGDOM DEBUG: LoadingScreen unmounted ***');
    };
  }, []);

  // If loading takes too long, show debug button
  const showDebugButton = loadTime > 2;

  // Force reload function
  const forceReload = () => {
    console.log('*** KINGDOM DEBUG: Force reloading page ***');
    localStorage.setItem('debug_enabled', 'true');
    window.location.reload();
  };
  
  // Clear game state function
  const clearGameState = async () => {
    console.log('*** KINGDOM DEBUG: Attempting to clear game state ***');
    try {
      const { supabase } = await import('../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && session.user) {
        console.log(`*** KINGDOM DEBUG: Clearing game state for user ${session.user.id} ***`);
        const { error } = await supabase
          .from('game_states')
          .delete()
          .eq('id', session.user.id);
          
        if (error) {
          console.error('*** KINGDOM DEBUG: Error clearing game state ***', error);
        } else {
          console.log('*** KINGDOM DEBUG: Game state cleared successfully ***');
          window.location.reload();
        }
      } else {
        console.error('*** KINGDOM DEBUG: No active session found ***');
      }
    } catch (error) {
      console.error('*** KINGDOM DEBUG: Error in clearGameState ***', error);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      fontFamily: 'monospace'
    }}>
      <div style={{ 
        padding: '30px', 
        border: '1px solid black',
        maxWidth: '600px',
        width: '100%',
        textAlign: 'center'
      }}>
        <h2 style={{ fontWeight: 'normal', marginBottom: '20px' }}>Kingdom Management Game</h2>
        
        <div style={{ marginBottom: '20px' }}>
          {message}{dots}
        </div>
        
        <div style={{ fontSize: '12px', marginTop: '10px' }}>
          Loading time: {loadTime}s
        </div>
        
        {(showDebugButton || forceDebug) && (
          <div style={{ marginTop: '20px' }}>
            <button 
              onClick={() => setShowDebugInfo(!showDebugInfo)}
              style={{ 
                padding: '5px 10px',
                border: '1px solid black',
                background: 'white',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: '12px',
                marginRight: '10px'
              }}
            >
              {showDebugInfo ? 'Hide Debug Info' : 'Show Debug Info'}
            </button>
            
            <button 
              onClick={forceReload}
              style={{ 
                padding: '5px 10px',
                border: '1px solid black',
                background: 'white',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: '12px',
                marginRight: '10px'
              }}
            >
              Force Reload
            </button>
            
            <button 
              onClick={clearGameState}
              style={{ 
                padding: '5px 10px',
                border: '1px solid black',
                background: 'white',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: '12px'
              }}
            >
              Reset Game State
            </button>
          </div>
        )}
        
        {(showDebugInfo || forceDebug) && (
          <div style={{ 
            marginTop: '20px', 
            textAlign: 'left', 
            fontSize: '12px',
            border: '1px solid black',
            padding: '10px',
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            <p><strong>Debug Information:</strong></p>
            <p>If you're seeing this screen for too long, there might be an issue with:</p>
            <ul style={{ paddingLeft: '20px' }}>
              <li>Database connection</li>
              <li>Authentication</li>
              <li>Game state initialization</li>
            </ul>
            
            <div style={{ 
              marginTop: '15px',
              marginBottom: '15px',
              border: '1px solid #ccc',
              padding: '10px',
              background: '#f5f5f5',
              maxHeight: '150px',
              overflowY: 'auto',
              fontFamily: 'monospace',
              fontSize: '10px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all'
            }}>
              <strong>Console Output:</strong>
              {consoleOutput.length === 0 ? (
                <div style={{ color: '#888', marginTop: '5px' }}>No debug output captured yet...</div>
              ) : (
                consoleOutput.map((line, index) => (
                  <div key={index} style={{ 
                    color: line.includes('ERROR') ? 'red' : line.includes('WARN') ? 'orange' : 'black',
                    marginBottom: '2px'
                  }}>
                    {line}
                  </div>
                ))
              )}
            </div>
            
            <p>Try these steps:</p>
            <ol style={{ paddingLeft: '20px' }}>
              <li>Click "Force Reload" to refresh with debug mode enabled</li>
              <li>If that doesn't work, click "Reset Game State" to clear your game data</li>
              <li>Check browser console (F12) for more detailed errors</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
