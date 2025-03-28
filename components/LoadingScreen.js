import React, { useState, useEffect } from 'react';
import { debug } from '../lib/debug';
import { testSupabaseConnection, diagnoseDatabaseIssues } from '../lib/supabase';

export default function LoadingScreen({ message = 'Loading your kingdom...' }) {
  const [dots, setDots] = useState('');
  const [loadTime, setLoadTime] = useState(0);
  const [loadPercent, setLoadPercent] = useState(0);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState([]);
  const [forceDebug, setForceDebug] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Unknown');
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [diagnosticResults, setDiagnosticResults] = useState(null);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [showSkipButton, setShowSkipButton] = useState(false);

  useEffect(() => {
    // Force debug mode after 3 seconds
    const forceDebugTimeout = setTimeout(() => {
      setForceDebug(true);
      setShowDebugInfo(true);
      console.log('*** KINGDOM DEBUG: Force debug mode activated ***');
    }, 3000);
    
    // Show skip button after 10 seconds
    const skipButtonTimeout = setTimeout(() => {
      setShowSkipButton(true);
    }, 10000);
    
    debug.log('LoadingScreen', 'Loading screen mounted', { message });
    console.log('*** KINGDOM DEBUG: LoadingScreen mounted ***');
    
    // Animate the loading dots
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length < 3 ? prev + '.' : '');
    }, 500);
    
    // Track loading time
    const loadTimeInterval = setInterval(() => {
      setLoadTime(prevLoadTime => prevLoadTime + 1);
      setLoadPercent(prevLoadPercent => Math.min(prevLoadPercent + 10, 100));
      
      // Auto-test connection after 5 seconds
      if (loadTime === 5) {
        testConnection();
      }
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
      clearTimeout(skipButtonTimeout);
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
  
  // Skip loading function
  const skipLoading = async () => {
    console.log('*** KINGDOM DEBUG: Skipping loading process ***');
    try {
      // Import dependencies
      const { supabase } = await import('../lib/supabase');
      const { useGame } = await import('../contexts/GameContext');
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && session.user) {
        console.log('*** KINGDOM DEBUG: Creating emergency game state ***');
        
        // Create emergency game state
        const emergencyGameState = {
          id: session.user.id,
          kingdom_name: 'Emergency Kingdom',
          resources: { gold: 1000, food: 500, wood: 300, stone: 200 },
          buildings: { castle: { level: 1 }, barracks: { level: 1 }, farm: { level: 1 }, mine: { level: 1 } },
          army: { swordsmen: 10, archers: 5, cavalry: 0, catapults: 0 },
          last_resource_collection: new Date().toISOString()
        };
        
        // Try to save emergency state to database
        try {
          const { error } = await supabase
            .from('game_states')
            .upsert(emergencyGameState, { onConflict: 'id' });
            
          if (error) {
            console.error('*** KINGDOM DEBUG: Error saving emergency game state ***', error);
          } else {
            console.log('*** KINGDOM DEBUG: Emergency game state saved ***');
          }
        } catch (dbError) {
          console.error('*** KINGDOM DEBUG: Database error saving emergency state ***', dbError);
        }
        
        // Force reload with bypass flag
        localStorage.setItem('bypass_loading', 'true');
        localStorage.setItem('emergency_game_state', JSON.stringify(emergencyGameState));
        window.location.reload();
      } else {
        console.error('*** KINGDOM DEBUG: No active session found for emergency state ***');
        // Redirect to login page
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('*** KINGDOM DEBUG: Error in skipLoading ***', error);
      // Force reload as fallback
      localStorage.setItem('bypass_loading', 'true');
      window.location.reload();
    }
  };
  
  // Test connection function
  const testConnection = async () => {
    try {
      setIsTesting(true);
      setConnectionStatus('Testing...');
      console.log('*** KINGDOM DEBUG: Manually testing Supabase connection ***');
      
      const result = await testSupabaseConnection();
      
      setTestResults(result);
      setConnectionStatus(result.success ? 'Connected' : 'Failed');
      console.log('*** KINGDOM DEBUG: Manual connection test result ***', result);
    } catch (error) {
      console.error('*** KINGDOM DEBUG: Error in manual connection test ***', error);
      setConnectionStatus('Error');
      setTestResults({ success: false, error: error.message });
    } finally {
      setIsTesting(false);
    }
  };
  
  // Run comprehensive diagnostics
  const runDiagnostics = async () => {
    try {
      setIsRunningDiagnostics(true);
      console.log('*** KINGDOM DEBUG: Running comprehensive diagnostics ***');
      
      const results = await diagnoseDatabaseIssues();
      
      setDiagnosticResults(results);
      console.log('*** KINGDOM DEBUG: Diagnostic results ***', results);
    } catch (error) {
      console.error('*** KINGDOM DEBUG: Error running diagnostics ***', error);
      setDiagnosticResults({ 
        success: false, 
        error: error.message,
        recommendations: ['An error occurred while running diagnostics']
      });
    } finally {
      setIsRunningDiagnostics(false);
    }
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
    <div className="loading-screen">
      <div className="loading-content">
        <h1>Loading Your Kingdom</h1>
        <div className="loading-bar-container">
          <div 
            className="loading-bar" 
            style={{ width: `${loadPercent}%` }}
          ></div>
        </div>
        <p>{message}{dots}</p>
        
        <div className="connection-status">
          Loading time: {loadTime}s | Supabase: <span className={
            connectionStatus === 'Connected' ? 'status-connected' : 
            connectionStatus === 'Failed' ? 'status-failed' : 
            connectionStatus === 'Testing...' ? 'status-testing' : ''
          }>
            {connectionStatus}
          </span>
        </div>
        
        {loadTime > 5 && (
          <div className="skip-loading-container">
            <button 
              className="skip-loading-button"
              onClick={() => {
                console.log('*** KINGDOM DEBUG: Skip loading button clicked ***');
                localStorage.setItem('bypass_loading', 'true');
                window.location.reload();
              }}
            >
              Skip Loading
            </button>
            <p className="skip-loading-info">
              Having trouble connecting? Click to skip the loading screen.
            </p>
          </div>
        )}
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
              onClick={testConnection}
              disabled={isTesting}
              style={{ 
                padding: '5px 10px',
                border: '1px solid black',
                background: 'white',
                cursor: isTesting ? 'default' : 'pointer',
                fontFamily: 'monospace',
                fontSize: '12px',
                marginRight: '10px',
                opacity: isTesting ? 0.7 : 1
              }}
            >
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>
            
            <button 
              onClick={runDiagnostics}
              disabled={isRunningDiagnostics}
              style={{ 
                padding: '5px 10px',
                border: '1px solid black',
                background: 'white',
                cursor: isRunningDiagnostics ? 'default' : 'pointer',
                fontFamily: 'monospace',
                fontSize: '12px',
                marginRight: '10px',
                opacity: isRunningDiagnostics ? 0.7 : 1
              }}
            >
              {isRunningDiagnostics ? 'Running...' : 'Run Diagnostics'}
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
            
            {testResults && (
              <div style={{
                marginBottom: '15px',
                padding: '10px',
                border: '1px solid #ccc',
                background: testResults.success ? '#f0fff0' : '#fff0f0'
              }}>
                <p><strong>Connection Test Results:</strong></p>
                <pre style={{ 
                  fontSize: '10px', 
                  margin: '5px 0',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all'
                }}>
                  {JSON.stringify(testResults, null, 2)}
                </pre>
              </div>
            )}
            
            {diagnosticResults && (
              <div style={{
                marginBottom: '15px',
                padding: '10px',
                border: '1px solid #ccc',
                background: '#f5f5ff'
              }}>
                <p><strong>Diagnostic Results:</strong></p>
                
                {diagnosticResults.recommendations && diagnosticResults.recommendations.length > 0 && (
                  <div style={{
                    marginBottom: '10px',
                    padding: '10px',
                    border: '1px solid #ffc107',
                    background: '#fffbf0'
                  }}>
                    <p><strong>Recommendations:</strong></p>
                    <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
                      {diagnosticResults.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <pre style={{ 
                  fontSize: '10px', 
                  margin: '5px 0',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  maxHeight: '150px',
                  overflowY: 'auto'
                }}>
                  {JSON.stringify(diagnosticResults, null, 2)}
                </pre>
              </div>
            )}
            
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
              <li>Click "Run Diagnostics" to get detailed information about the Supabase connection</li>
              <li>Check the recommendations in the diagnostic results</li>
              <li>Visit the Supabase dashboard to verify your project is active</li>
              <li>Check browser console (F12) for more detailed errors</li>
              <li>If all else fails, use the "Skip Loading" button to enter emergency mode</li>
            </ol>
          </div>
        )}
      </div>
      <style jsx>{`
        .loading-screen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: #2c3e50;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          color: white;
          font-family: 'Arial', sans-serif;
        }
        .loading-content {
          text-align: center;
          width: 80%;
          max-width: 500px;
        }
        .loading-bar-container {
          width: 100%;
          height: 20px;
          background: #34495e;
          border-radius: 10px;
          margin: 20px 0;
          overflow: hidden;
        }
        .loading-bar {
          height: 100%;
          background: #f39c12;
          transition: width 0.5s ease;
        }
        .connection-status {
          font-size: 14px;
          margin: 15px 0;
        }
        .status-connected {
          color: #2ecc71;
        }
        .status-failed {
          color: #e74c3c;
        }
        .status-testing {
          color: #f39c12;
        }
        .skip-loading-container {
          margin-top: 20px;
          padding: 10px;
          border: 1px dashed #f39c12;
          border-radius: 5px;
        }
        .skip-loading-button {
          background: #e74c3c;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .skip-loading-button:hover {
          background: #c0392b;
        }
        .skip-loading-info {
          font-size: 0.8rem;
          color: #bdc3c7;
        }
      `}</style>
    </div>
  );
}
