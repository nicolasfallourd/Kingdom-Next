import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';

export default function Login() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', isError: true });
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', isError: true });

    try {
      // Create a deterministic email from the name for Supabase auth
      const email = `${name.toLowerCase().replace(/\s+/g, '_')}@kingdom-game.com`;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      router.push('/');
    } catch (error) {
      setMessage({ text: error.message, isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setLoading(true);
    setMessage({ text: '', isError: true });

    try {
      // Generate a more reliable random name
      const randomId = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
      const guestName = `Guest_${randomId.substring(0, 6)}`;
      const anonymousEmail = `user_${randomId}@kingdom-game.com`;
      
      // Generate a secure random password
      const randomPassword = Math.random().toString(36).substring(2, 10) + 
                            Math.random().toString(36).substring(2, 10) + 
                            Math.random().toString(36).substring(2, 10);
      
      const { data, error } = await supabase.auth.signUp({
        email: anonymousEmail,
        password: randomPassword,
        options: {
          data: {
            username: guestName
          }
        }
      });
      
      if (error) throw error;
      
      // Automatically sign in after registration
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: anonymousEmail,
        password: randomPassword
      });
      
      if (signInError) throw signInError;
      
      // Redirect to game
      router.push('/');
    } catch (error) {
      setMessage({ text: error.message, isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login - Kingdom Management Game</title>
        <meta name="description" content="Login to the Kingdom Management Game" />
      </Head>
      
      <div style={{ maxWidth: '400px', margin: '100px auto 0', fontFamily: 'monospace' }}>
        <div style={{ border: '1px solid black', padding: '20px' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '20px', fontWeight: 'normal' }}>Kingdom Management Game</h1>
          
          {message.text && (
            <div style={{ 
              border: '1px solid black', 
              padding: '10px', 
              marginBottom: '15px',
              fontFamily: 'monospace'
            }}>
              {message.text}
            </div>
          )}
          
          {loading && (
            <div style={{ textAlign: 'center', margin: '15px 0' }}>
              <p>Processing...</p>
            </div>
          )}
          
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="name" style={{ display: 'block', marginBottom: '5px' }}>Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid black',
                  fontFamily: 'monospace'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid black',
                  fontFamily: 'monospace'
                }}
              />
            </div>
            
            <button 
              type="submit" 
              style={{ 
                width: '100%', 
                marginBottom: '15px',
                padding: '8px',
                border: '1px solid black',
                background: 'white',
                cursor: 'pointer',
                fontFamily: 'monospace'
              }}
              disabled={loading}
            >
              Login
            </button>
          </form>
          
          <button 
            onClick={handleAnonymousLogin} 
            style={{ 
              width: '100%', 
              marginBottom: '15px',
              padding: '8px',
              border: '1px solid black',
              background: 'white',
              cursor: 'pointer',
              fontFamily: 'monospace'
            }}
            disabled={loading}
          >
            Play as Guest
          </button>
          
          <div style={{ textAlign: 'center', marginTop: '15px' }}>
            Don't have an account? <Link href="/register" style={{ textDecoration: 'underline', color: 'black' }}>Register here</Link>
          </div>
        </div>
      </div>
    </>
  );
}
