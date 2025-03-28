import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', isError: true });
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', isError: true });

    try {
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
      // Generate a more reliable random email
      const randomId = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
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
            username: `Guest_${randomId.substring(0, 6)}`
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
      
      <div className="container" style={{ maxWidth: '400px', marginTop: '100px' }}>
        <div className="card">
          <h1 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Kingdom Management Game</h1>
          
          {message.text && (
            <div className={`notification ${message.isError ? 'error' : 'success'}`} style={{ marginBottom: '1rem' }}>
              {message.text}
            </div>
          )}
          
          {loading && (
            <div style={{ textAlign: 'center', margin: '1rem 0' }}>
              <div className="spinner"></div>
              <p>Processing...</p>
            </div>
          )}
          
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-secondary" 
              style={{ width: '100%', marginBottom: '1rem' }}
              disabled={loading}
            >
              Login
            </button>
          </form>
          
          <button 
            onClick={handleAnonymousLogin} 
            className="btn btn-accent" 
            style={{ width: '100%', marginBottom: '1rem' }}
            disabled={loading}
          >
            Play as Guest
          </button>
          
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            Don't have an account? <Link href="/register">Register here</Link>
          </div>
        </div>
      </div>
    </>
  );
}
