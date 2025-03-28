import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';

export default function Register() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', isError: true });
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', isError: true });

    try {
      // Create a deterministic email from the name for Supabase auth
      const email = `${name.toLowerCase().replace(/\s+/g, '_')}@kingdom-game.com`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: name
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
      
      <div style={{ maxWidth: '400px', margin: '100px auto 0', fontFamily: 'monospace' }}>
        <div style={{ border: '1px solid black', padding: '20px' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '20px', fontWeight: 'normal' }}>Create Your Kingdom</h1>
          
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
          
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="name" style={{ display: 'block', marginBottom: '5px' }}>Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={3}
                maxLength={20}
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
                minLength={6}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid black',
                  fontFamily: 'monospace'
                }}
              />
              <small style={{ marginTop: '5px', display: 'block' }}>
                Password must be at least 6 characters long
              </small>
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
              Register
            </button>
          </form>
          
          <div style={{ textAlign: 'center', marginTop: '15px' }}>
            Already have an account? <Link href="/login" style={{ textDecoration: 'underline', color: 'black' }}>Login here</Link>
          </div>
        </div>
      </div>
    </>
  );
}
