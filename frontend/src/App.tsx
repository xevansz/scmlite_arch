import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Signup } from './pages/Signup';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CreateShipment } from './pages/CreateShipment';
import { DeviceData } from './pages/DeviceData';
import { DeviceDataPage } from './pages/DeviceDataPage';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-shipment"
          element={
            <ProtectedRoute>
              <CreateShipment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/device-data"
          element={
            <ProtectedRoute>
              <DeviceDataPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/device-data/:device_id"
          element={
            <ProtectedRoute>
              <DeviceData />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
