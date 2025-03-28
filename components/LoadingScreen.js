import React from 'react';

export default function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: 'var(--color-background)'
    }}>
      <h1 style={{ marginBottom: '2rem', color: 'var(--color-text-important)' }}>
        Kingdom Management Game
      </h1>
      <div className="spinner"></div>
      <p style={{ marginTop: '1rem', color: 'var(--color-text)' }}>
        Loading your kingdom...
      </p>
    </div>
  );
}
