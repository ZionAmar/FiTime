import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, activeRole, isLoading, isSwitchingAuth } = useAuth(); 

    if (isLoading || isSwitchingAuth) { 
        return <div className="loading">מאמת פרטי משתמש...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }
    
    if (!activeRole) {
        return null; 
    }
    
    const hasPermission = allowedRoles.includes(activeRole);

    return hasPermission ? <Outlet /> : <Navigate to="/unauthorized" replace />;
};

export default ProtectedRoute;