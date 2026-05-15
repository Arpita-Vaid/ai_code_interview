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
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      const me = await (await authFetch('/users/me')).json();
      login(data.access_token, data.refresh_token, me);
      nav('/dashboard');
    } catch (err) { setError(err.message); setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <div className="bg-orbs"><div className="orb orb-1"/><div className="orb orb-2"/><div className="orb orb-3"/></div>
      <div className="glass-card p-10 w-full max-w-md animate-slide-up relative z-10">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎯</div>
          <h1 className="text-2xl font-extrabold mb-1">Welcome Back</h1>
          <p className="text-sm text-gray-500">Sign in to your AI Interview account</p>
        </div>
        {error && <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoFocus
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-[var(--color-accent)] transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-[var(--color-accent)] transition-colors" />
          </div>
          <button type="submit" disabled={loading} className="btn-gradient w-full py-3 rounded-xl font-bold text-sm">
            {loading ? <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full loader-spin" /> : 'Sign In'}
          </button>
        </form>
        <div className="relative my-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div><div className="relative text-center"><span className="bg-[#0e0e1a] px-4 text-xs text-gray-600">or</span></div></div>
        <a href={`${API}/auth/google`} className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors">
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="" width="18" /> Continue with Google
        </a>
        <p className="text-center text-xs text-gray-500 mt-6">Don't have an account? <Link to="/register" className="text-[var(--color-accent-light)] hover:underline">Sign Up</Link></p>
      </div>
    </div>
  );
}
