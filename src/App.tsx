import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './layouts/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import DocumentDetail from './pages/DocumentDetail';
import DocumentForm from './pages/DocumentForm';
import Tasks from './pages/Tasks';
import DemoDataGenerator from './pages/DemoDataGenerator';
import AdminUsers from './pages/AdminUsers';
import CategoryManager from './pages/CategoryManager';
import Notifications from './pages/Notifications';
import RegionalInfo from './pages/RegionalInfo';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="documents" element={<Documents />} />
        <Route path="documents/new" element={<DocumentForm />} />
        <Route path="documents/:id" element={<DocumentDetail />} />
        <Route path="documents/:id/edit" element={<DocumentForm />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="regional" element={<RegionalInfo />} />
        <Route path="admin/demo" element={<DemoDataGenerator />} />
        <Route path="admin/users" element={<AdminUsers />} />
        <Route path="admin/categories" element={<CategoryManager />} />
      </Route>
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



