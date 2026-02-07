import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Breadcrumbs from './components/Breadcrumbs';
import './App.css';
import 'react-datepicker/dist/react-datepicker.css';

const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const SchedulePage = lazy(() => import('./pages/SchedulePage'));
const MemberHistoryPage = lazy(() => import('./pages/MemberHistoryPage'));
const TrainerHistoryPage = lazy(() => import('./pages/TrainerHistoryPage'));
const ManageSchedulePage = lazy(() => import('./pages/ManageSchedulePage'));
const BookingConfirmedPage = lazy(() => import('./pages/BookingConfirmedPage'));
const BookingErrorPage = lazy(() => import('./pages/BookingErrorPage'));
const OwnerDashboardPage = lazy(() => import('./pages/OwnerDashboardPage'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const MyMembershipsPage = lazy(() => import('./pages/MyMembershipsPage'));

const PageFallback = () => <div className="loading" aria-live="polite">טוען...</div>;

const AppRoutes = () => {
    const { isLoading } = useAuth();

    if (isLoading) {
        return <div className="loading">טוען...</div>;
    }

    return (
        <Suspense fallback={<PageFallback />}>
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/booking-confirmed" element={<BookingConfirmedPage status="confirmed" />} />
            <Route path="/booking-declined" element={<BookingConfirmedPage status="declined" />} />
            <Route path="/booking-error" element={<BookingErrorPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            
            <Route element={<MainLayout />}>
                <Route element={<ProtectedRoute allowedRoles={['owner']} />}>
                    <Route path="/owner-dashboard" element={<OwnerDashboardPage />} />
                </Route>
                <Route element={<ProtectedRoute allowedRoles={['admin', 'trainer', 'member']} />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/schedule" element={<SchedulePage />} />
                    <Route path="/history" element={<MemberHistoryPage />} />
                    <Route path="/trainer-history" element={<TrainerHistoryPage />} />
                    <Route path="/my-memberships" element={<MyMembershipsPage />} />
                </Route>
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                    <Route path="/manage/schedule" element={<ManageSchedulePage />} />
                </Route>
            </Route>

            <Route path="/unauthorized" element={
                <div style={{textAlign: 'center', marginTop: '50px'}}>
                    <h1>403 - אין הרשאה</h1>
                    <p>אין לך הרשאה לגשת לדף המבוקש.</p>
                </div>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
    );
};

// --- כאן השינוי: הזזת פירורי הלחם למקום קבוע ---
const MainLayout = () => {
    return (
        <div className="layout-wrapper"> 
            {/* 1. הדר קבוע */}
            <Navbar />
            
            {/* 2. פירורי לחם קבועים (אם קיימים, יופיעו כאן ולא יגללו) */}
            <Breadcrumbs />
            
            {/* 3. אזור הגלילה - מכיל רק את התוכן והפוטר */}
            <div className="content-scroll-area">
                <main className="main-content">
                    <Outlet />
                </main>
                <Footer />
            </div>
        </div>
    );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes /> 
      </AuthProvider>
    </Router>
  );
}

export default App;