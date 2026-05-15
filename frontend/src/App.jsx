import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import InterviewLobby from './pages/InterviewLobby';
import AIInterviewRoom from './pages/AIInterviewRoom';
import CodingProblems from './pages/CodingProblems';

import EmotionDetection from './pages/EmotionDetection';
import ResumeUpload from './pages/ResumeUpload';
import ResumeAnalysis from './pages/ResumeAnalysis';

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen gap-3 text-gray-500">
      <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full loader-spin" />
      <span>Loading…</span>
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/ai-interview" element={<ProtectedRoute><InterviewLobby /></ProtectedRoute>} />
      <Route path="/ai-interview/:roundType" element={<ProtectedRoute><AIInterviewRoom /></ProtectedRoute>} />
      <Route path="/coding" element={<ProtectedRoute><CodingProblems /></ProtectedRoute>} />

      <Route path="/emotion" element={<ProtectedRoute><EmotionDetection /></ProtectedRoute>} />
      <Route path="/resume" element={<ProtectedRoute><ResumeUpload /></ProtectedRoute>} />
      <Route path="/resume/:id/analysis" element={<ProtectedRoute><ResumeAnalysis /></ProtectedRoute>} />
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
