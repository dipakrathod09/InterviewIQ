import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import InterviewSetup from './pages/interview/InterviewSetup';
import InterviewHistory from './pages/interview/InterviewHistory';
import InterviewRoom from './pages/interview/InterviewRoom';
import InterviewResults from './pages/interview/InterviewResults';
import Profile from './pages/Profile';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppShell from './components/layout/AppShell';
import './index.css';
export default function App() {
  return <AuthProvider><BrowserRouter><Routes>
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} />
    <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
      <Route path="/dashboard" element={<Dashboard />} /><Route path="/profile" element={<Profile />} />
      <Route path="/interviews" element={<InterviewHistory />} /><Route path="/interview/setup" element={<InterviewSetup />} />
      <Route path="/interview/:sessionId" element={<InterviewRoom />} /><Route path="/interview/:sessionId/results" element={<InterviewResults />} />
    </Route>
  </Routes></BrowserRouter></AuthProvider>;
}
