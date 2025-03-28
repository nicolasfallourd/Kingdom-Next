import React, { useState, useEffect } from 'react';
import { debug } from '../lib/debug';

export default function LoadingScreen({ message = 'Loading your kingdom...' }) {
  const [dots, setDots] = useState('');
  const [loadTime, setLoadTime] = useState(0);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  useEffect(() => {
    debug.log('LoadingScreen', 'Loading screen mounted', { message });
    
    // Animate the loading dots
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length < 3 ? prev + '.' : '');
    }, 500);
    
    // Track loading time
    const loadTimeInterval = setInterval(() => {
      setLoadTime(prev => prev + 1);
    }, 1000);
    
    return () => {
      clearInterval(dotsInterval);
      clearInterval(loadTimeInterval);
      debug.log('LoadingScreen', 'Loading screen unmounted');
    };
  }, []);

  // If loading takes too long, show debug button
  const showDebugButton = loadTime > 5;

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
        maxWidth: '400px',
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
        
        {showDebugButton && (
          <button 
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            style={{ 
              marginTop: '20px',
              padding: '5px 10px',
              border: '1px solid black',
              background: 'white',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: '12px'
            }}
          >
            {showDebugInfo ? 'Hide Debug Info' : 'Show Debug Info'}
          </button>
        )}
        
        {showDebugInfo && (
          <div style={{ 
            marginTop: '20px', 
            textAlign: 'left', 
            fontSize: '12px',
            border: '1px solid black',
            padding: '10px',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            <p><strong>Debug Information:</strong></p>
            <p>If you're seeing this screen for too long, there might be an issue with:</p>
            <ul style={{ paddingLeft: '20px' }}>
              <li>Database connection</li>
              <li>Authentication</li>
              <li>Game state initialization</li>
            </ul>
            <p>Try these steps:</p>
            <ol style={{ paddingLeft: '20px' }}>
              <li>Refresh the page</li>
              <li>Clear browser cache</li>
              <li>Log out and log back in</li>
            </ol>
            <button 
              onClick={() => window.location.reload()}
              style={{ 
                marginTop: '10px',
                padding: '5px 10px',
                border: '1px solid black',
                background: 'white',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: '12px'
              }}
            >
              Refresh Page
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
