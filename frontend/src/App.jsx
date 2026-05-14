import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import InterviewSession from './pages/InterviewSession';
import CodingProblems from './pages/CodingProblems';
import CodingSession from './pages/CodingSession';
import EmotionDetection from './pages/EmotionDetection';

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loader"><div className="loader-spinner" /><span>Loading…</span></div>;

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/interview" element={<ProtectedRoute><InterviewSession /></ProtectedRoute>} />
      <Route path="/coding" element={<ProtectedRoute><CodingProblems /></ProtectedRoute>} />
      <Route path="/coding/:id" element={<ProtectedRoute><CodingSession /></ProtectedRoute>} />
      <Route path="/emotion" element={<ProtectedRoute><EmotionDetection /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
