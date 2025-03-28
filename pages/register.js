import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', isError: true });
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', isError: true });

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username
          }
        }
      });

      if (error) throw error;
      
      setMessage({ 
        text: 'Registration successful! You can now log in.', 
        isError: false 
      });
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/login');
      }, 2000);
      
    } catch (error) {
      setMessage({ text: error.message, isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Register - Kingdom Management Game</title>
        <meta name="description" content="Register for the Kingdom Management Game" />
      </Head>
      
      <div className="container" style={{ maxWidth: '400px', marginTop: '100px' }}>
        <div className="card">
          <h1 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Create Your Kingdom</h1>
          
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
          
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={20}
              />
            </div>
            
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
                minLength={6}
              />
              <small style={{ color: 'var(--color-text)', marginTop: '0.25rem', display: 'block' }}>
                Password must be at least 6 characters long
              </small>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginBottom: '1rem' }}
              disabled={loading}
            >
              Register
            </button>
          </form>
          
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            Already have an account? <Link href="/login">Login here</Link>
          </div>
        </div>
      </div>
    </>
  );
}
