import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const loc = useLocation();
  const isActive = (path) => loc.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <div className="brand-icon">🎯</div>
        <span className="brand-name">AI Interview</span>
      </div>
      <div className="nav-links">
        <Link to="/dashboard" className={isActive('/dashboard')}>📊 Dashboard</Link>
        <Link to="/interview" className={isActive('/interview')}>🎤 Q&A</Link>
        <Link to="/coding" className={isActive('/coding')}>💻 Coding</Link>
        <Link to="/emotion" className={isActive('/emotion')}>😊 Emotion</Link>
      </div>
      <div className="nav-actions">
        {user && (
          <>
            <div className="avatar-circle">{(user.name || user.email)[0].toUpperCase()}</div>
            <button className="btn btn-outline btn-sm" onClick={logout}>Sign Out</button>
          </>
        )}
      </div>
    </nav>
  );
}
