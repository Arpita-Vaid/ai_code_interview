import { createContext, useContext, useState, useEffect } from 'react';
import { getAccessToken, clearTokens, setTokens, authFetch, logout as apiLogout } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Pick up tokens from URL (Google OAuth callback redirect)
    const params = new URLSearchParams(window.location.search);
    const urlAccess  = params.get('access_token');
    const urlRefresh = params.get('refresh_token');
    if (urlAccess && urlRefresh) {
      setTokens(urlAccess, urlRefresh);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }

    if (!getAccessToken()) { setLoading(false); return; }
    authFetch('/users/me').then(async (res) => {
      if (res.ok) setUser(await res.json());
      else {
        alert(`Login failed: /users/me returned status ${res.status}. Check API URL or CORS.`);
        clearTokens();
      }
    }).catch((err) => {
      alert(`Network error during login verification: ${err.message}. This is likely a CORS or connection issue.`);
      clearTokens();
    }).finally(() => setLoading(false));
  }, []);

  const login = (access, refresh, userData) => {
    setTokens(access, refresh);
    setUser(userData);
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
