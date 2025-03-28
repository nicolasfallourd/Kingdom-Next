import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Bypass() {
  const [status, setStatus] = useState('Preparing emergency mode...');
  const router = useRouter();

  useEffect(() => {
    const setupEmergencyMode = async () => {
      try {
        setStatus('Setting up emergency mode...');
        
        // Import Supabase client
        const { supabase } = await import('../lib/supabase');
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session || !session.user) {
          setStatus('No active session found. Redirecting to login...');
          setTimeout(() => router.push('/login'), 2000);
          return;
        }
        
        setStatus(`Creating emergency game state for user ${session.user.id}...`);
        
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
          setStatus('Saving emergency game state to database...');
          const { error } = await supabase
            .from('game_states')
            .upsert(emergencyGameState, { onConflict: 'id' });
            
          if (error) {
            console.error('Error saving emergency game state:', error);
            setStatus(`Database error: ${error.message}. Using local state only.`);
          } else {
            setStatus('Emergency game state saved successfully!');
          }
        } catch (dbError) {
          console.error('Database error:', dbError);
          setStatus(`Database error: ${dbError.message}. Using local state only.`);
        }
        
        // Set emergency flags
        localStorage.setItem('bypass_loading', 'true');
        localStorage.setItem('emergency_game_state', JSON.stringify(emergencyGameState));
        
        setStatus('Emergency mode activated! Redirecting to home page...');
        setTimeout(() => router.push('/'), 2000);
        
      } catch (error) {
        console.error('Error in emergency mode setup:', error);
        setStatus(`Error: ${error.message}. Please try again.`);
      }
    };
    
    setupEmergencyMode();
  }, [router]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      fontFamily: 'monospace',
      background: '#f8f9fa'
    }}>
      <Head>
        <title>Emergency Bypass | Kingdom Game</title>
      </Head>
      
      <div style={{ 
        padding: '30px', 
        border: '2px solid #ff9800',
        borderRadius: '8px',
        background: '#fff3e0',
        maxWidth: '600px',
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ 
          fontWeight: 'bold', 
          marginBottom: '20px',
          color: '#e65100'
        }}>
          ⚠️ Emergency Bypass Mode
        </h2>
        
        <div style={{ 
          marginBottom: '30px',
          fontSize: '16px'
        }}>
          {status}
        </div>
        
        <div style={{ 
          height: '4px', 
          background: '#ff9800',
          width: '100%',
          borderRadius: '2px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ 
            position: 'absolute',
            height: '100%',
            width: '30%',
            background: '#e65100',
            borderRadius: '2px',
            animation: 'loading 1.5s infinite ease-in-out'
          }} />
        </div>
        
        <style jsx>{`
          @keyframes loading {
            0% { left: -30%; }
            100% { left: 100%; }
          }
        `}</style>
        
        <div style={{ 
          marginTop: '30px',
          fontSize: '14px',
          color: '#666'
        }}>
          This page creates an emergency game state and bypasses the normal loading process.
          <br />
          Use this only if you're stuck on the loading screen.
        </div>
      </div>
    </div>
  );
}
