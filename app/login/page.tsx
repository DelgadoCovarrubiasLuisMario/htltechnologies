'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Verificar si ya está autenticado solo una vez
    if (typeof window !== 'undefined') {
      const authStatus = localStorage.getItem('authenticated');
      if (authStatus === 'true') {
        router.push('/dashboard');
      }
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Credenciales simples
    if (username === 'arturo' && password === 'arturo123') {
      // Autenticación simple con localStorage
      // Cuando Firebase esté configurado, se puede migrar a Firebase Authentication
      localStorage.setItem('authenticated', 'true');
      localStorage.setItem('username', username);
      router.push('/dashboard');
    } else {
      setError('Usuario o contraseña incorrectos');
      setLoading(false);
    }
    
    setLoading(false);
  };

  return (
    <div className="container" style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh' 
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          marginBottom: '32px' 
        }}>
          <Image 
            src="/logo.jpg" 
            alt="HTL Electronics" 
            width={200} 
            height={100}
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>
        
        <form onSubmit={handleLogin}>
          <div>
            <label htmlFor="username" style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600',
              color: '#333'
            }}>
              Usuario
            </label>
            <input
              id="username"
              type="text"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingresa tu usuario"
              required
            />
          </div>

          <div>
            <label htmlFor="password" style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600',
              color: '#333'
            }}>
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa tu contraseña"
              required
            />
          </div>

          {error && (
            <div style={{ 
              color: '#dc3545', 
              marginBottom: '16px', 
              padding: '12px',
              background: '#f8d7da',
              borderRadius: '8px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}

