import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const loc = useLocation();
  const isActive = (path) => loc.pathname.startsWith(path) ? 'text-white bg-white/8' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5';

  return (
    <nav className="flex items-center px-6 py-3 bg-black/60 border-b border-white/5 backdrop-blur-xl sticky top-0 z-50">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 flex items-center justify-center text-lg">🎯</div>
        <span className="font-bold text-base hidden sm:block">AI Interview</span>
      </div>
      <div className="flex gap-1 ml-8 flex-1">
        <Link to="/dashboard" className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isActive('/dashboard')}`}>📊 Dashboard</Link>
        <Link to="/ai-interview" className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isActive('/ai-interview')}`}>🎤 AI Interview</Link>
        <Link to="/coding" className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isActive('/coding')}`}>💻 Coding</Link>
        <Link to="/emotion" className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isActive('/emotion')}`}>😊 Emotion</Link>
      </div>
      <div className="flex items-center gap-2.5">
        {user && (
          <>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-xs font-bold">
              {(user.name || user.email)[0].toUpperCase()}
            </div>
            <button onClick={logout} className="text-xs text-gray-500 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 transition-all">
              Sign Out
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
