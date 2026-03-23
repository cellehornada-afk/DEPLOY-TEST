import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Layout from './components/Layout';
import Home from './pages/Home';
import Rooms from './pages/Rooms';
import RoomDetail from './pages/RoomDetail';
import Buildings from './pages/Buildings';
import BuildingDetail from './pages/BuildingDetail';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/Dashboard';
import AdminRooms from './pages/admin/Rooms';
import AdminBuildings from './pages/admin/Buildings';
import AdminUsers from './pages/admin/Users';
import AdminPayments from './pages/admin/Payments';
import AdminRequests from './pages/admin/Requests';
import AdminBookings from './pages/admin/Bookings';
import AdminAnalytics from './pages/admin/Analytics';
import AdminContact from './pages/admin/Contact';
import TenantDashboard from './pages/tenant/Dashboard';
import TenantPayments from './pages/tenant/Payments';
import TenantRequests from './pages/tenant/Requests';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="rooms" element={<Rooms />} />
        <Route path="rooms/:id" element={<RoomDetail />} />
        <Route path="buildings" element={<Buildings />} />
        <Route path="buildings/:id" element={<BuildingDetail />} />
        <Route path="contact" element={<Contact />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />

        <Route path="admin" element={
          <ProtectedRoute roles={['ADMIN', 'LANDLORD', 'MAINTENANCE']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="admin/rooms" element={
          <ProtectedRoute roles={['ADMIN']}>
            <AdminRooms />
          </ProtectedRoute>
        } />
        <Route path="admin/buildings" element={
          <ProtectedRoute roles={['ADMIN']}>
            <AdminBuildings />
          </ProtectedRoute>
        } />
        <Route path="admin/users" element={
          <ProtectedRoute roles={['ADMIN']}>
            <AdminUsers />
          </ProtectedRoute>
        } />
        <Route path="admin/payments" element={
          <ProtectedRoute roles={['ADMIN', 'LANDLORD']}>
            <AdminPayments />
          </ProtectedRoute>
        } />
        <Route path="admin/requests" element={
          <ProtectedRoute roles={['ADMIN', 'LANDLORD', 'MAINTENANCE']}>
            <AdminRequests />
          </ProtectedRoute>
        } />
        <Route path="admin/bookings" element={
          <ProtectedRoute roles={['ADMIN', 'LANDLORD']}>
            <AdminBookings />
          </ProtectedRoute>
        } />
        <Route path="admin/analytics" element={
          <ProtectedRoute roles={['ADMIN', 'LANDLORD']}>
            <AdminAnalytics />
          </ProtectedRoute>
        } />
        <Route path="admin/contact" element={
          <ProtectedRoute roles={['ADMIN', 'LANDLORD']}>
            <AdminContact />
          </ProtectedRoute>
        } />

        <Route path="tenant" element={
          <ProtectedRoute roles={['TENANT']}>
            <TenantDashboard />
          </ProtectedRoute>
        } />
        <Route path="tenant/payments" element={
          <ProtectedRoute roles={['TENANT']}>
            <TenantPayments />
          </ProtectedRoute>
        } />
        <Route path="tenant/requests" element={
          <ProtectedRoute roles={['TENANT']}>
            <TenantRequests />
          </ProtectedRoute>
        } />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
