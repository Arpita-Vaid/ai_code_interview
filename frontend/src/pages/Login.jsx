import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiPost, authFetch, API } from '../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.includes('@')) { setError('Enter a valid email.'); return; }
    if (!password) { setError('Enter your password.'); return; }
    setLoading(true); setError('');
    try {
      const data = await apiPost('/auth/login', { email, password });
      const me = await (await authFetch('/users/me')).json();
      login(data.access_token, data.refresh_token, me);
      nav('/dashboard');
    } catch (err) { setError(err.message); setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="bg-orbs"><div className="orb orb-1"/><div className="orb orb-2"/><div className="orb orb-3"/></div>
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">🎯</div>
          <h1>Welcome Back</h1>
          <p>Sign in to your AI Interview account</p>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoFocus />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Sign In'}
          </button>
        </form>
        <div className="auth-divider"><span>or</span></div>
        <a href={`${API}/auth/google`} className="btn btn-google btn-full">
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="" width="18" /> Continue with Google
        </a>
        <p className="auth-footer">Don't have an account? <Link to="/register">Sign Up</Link></p>
      </div>
    </div>
  );
}
