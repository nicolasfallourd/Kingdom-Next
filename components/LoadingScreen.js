import React from 'react';

export default function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: 'white',
      fontFamily: 'monospace'
    }}>
      <h1 style={{ 
        marginBottom: '30px', 
        color: 'black',
        fontWeight: 'normal'
      }}>
        Kingdom Management Game
      </h1>
      <p style={{ 
        marginTop: '20px', 
        color: 'black'
      }}>
        Loading your kingdom...
      </p>
    </div>
  );
}
