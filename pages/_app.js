import { GameProvider } from '../contexts/GameContext';
import '../styles/globals.css';
import { useState, useEffect } from 'react';
import DebugPanel from '../components/DebugPanel';
import { Analytics } from '@vercel/analytics/react';

function MyApp({ Component, pageProps }) {
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  
  useEffect(() => {
    // Only show debug panel in development or when explicitly enabled
    const isDev = process.env.NODE_ENV === 'development';
    const debugEnabled = typeof window !== 'undefined' && localStorage.getItem('debug_enabled') === 'true';
    setShowDebugPanel(isDev || debugEnabled);
    
    // Add keyboard shortcut to toggle debug panel (Ctrl+Shift+D)
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        const newState = !showDebugPanel;
        setShowDebugPanel(newState);
        if (typeof window !== 'undefined') {
          localStorage.setItem('debug_enabled', newState.toString());
        }
        e.preventDefault();
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [showDebugPanel]);
  
  return (
    <GameProvider>
      <Component {...pageProps} />
      {showDebugPanel && <DebugPanel />}
      <Analytics />
    </GameProvider>
  );
}

export default MyApp;
