import { GameProvider } from '../contexts/GameContext';
import '../styles/globals.css';
import { useState, useEffect } from 'react';
import DebugPanel from '../components/DebugPanel';

function MyApp({ Component, pageProps }) {
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  
  useEffect(() => {
    // Only show debug panel in development or when explicitly enabled
    const isDev = process.env.NODE_ENV === 'development';
    const debugEnabled = localStorage.getItem('debug_enabled') === 'true';
    setShowDebugPanel(isDev || debugEnabled);
    
    // Add keyboard shortcut to toggle debug panel (Ctrl+Shift+D)
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        const newState = !showDebugPanel;
        setShowDebugPanel(newState);
        localStorage.setItem('debug_enabled', newState.toString());
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDebugPanel]);
  
  return (
    <GameProvider>
      <Component {...pageProps} />
      {showDebugPanel && <DebugPanel />}
    </GameProvider>
  );
}

export default MyApp;
