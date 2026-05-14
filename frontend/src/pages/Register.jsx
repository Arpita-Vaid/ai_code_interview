import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiPost, authFetch, API } from '../api';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  const strength = (() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong 💪'][strength];
  const strengthColor = ['transparent', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'][strength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.includes('@')) { setError('Enter a valid email.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    try {
      const data = await apiPost('/auth/register', { email, password, name });
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
          <div className="auth-logo">🚀</div>
          <h1>Create Account</h1>
          <p>Start your AI-powered interview journey</p>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Full Name</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Jane Doe" autoFocus />
          </div>
          <div className="input-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" />
            {password && (
              <div className="strength-bar">
                <div className="strength-fill" style={{ width: `${strength*25}%`, background: strengthColor }} />
                <span className="strength-label" style={{ color: strengthColor }}>{strengthLabel}</span>
              </div>
            )}
          </div>
          <div className="input-group">
            <label>Confirm Password</label>
            <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="••••••••" />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Create Account'}
          </button>
        </form>
        <div className="auth-divider"><span>or</span></div>
        <a href={`${API}/auth/google`} className="btn btn-google btn-full">
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="" width="18" /> Continue with Google
        </a>
        <p className="auth-footer">Already have an account? <Link to="/">Sign In</Link></p>
      </div>
    </div>
  );
}
