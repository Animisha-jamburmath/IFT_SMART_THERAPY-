import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PainLog from './pages/PainLog';
import DeviceSettings from './pages/DeviceSettings';
import Help from './pages/Help';
import AIAssistant from './pages/AIAssistant';
import TherapySessions from './pages/TherapySessions';
import ImagingReports from './pages/ImagingReports';
import PatientManagement from './pages/PatientManagement';
import Account from './pages/Account';
import ProtectedRoute from './components/layout/ProtectedRoute';

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/pain-log" element={<ProtectedRoute><PainLog /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><DeviceSettings /></ProtectedRoute>} />
        <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
        <Route path="/ai" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
        <Route path="/sessions" element={<ProtectedRoute><TherapySessions /></ProtectedRoute>} />
        <Route path="/imaging" element={<ProtectedRoute><ImagingReports /></ProtectedRoute>} />
        <Route path="/patients" element={<ProtectedRoute><PatientManagement /></ProtectedRoute>} />
        <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;