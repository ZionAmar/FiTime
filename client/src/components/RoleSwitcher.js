import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/RoleSwitcher.css';

function RoleSwitcher() {
    const { studios, activeRole, switchRole } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    const allUserRoles = studios 
        ? [...new Set(studios.flatMap(studio => studio.roles))] 
        : [];

    if ( allUserRoles.length <= 1) {
        return null; 
    }

    const handleRoleChange = (newRole) => {
        switchRole(newRole);
        setIsOpen(false);
    };

    const translateRole = (role) => {
        switch (role) {
            case 'admin': return 'מנהל';
            case 'trainer': return 'מאמן';
            case 'member': return 'מתאמן';
            default: return role;
        }
    };

    return (
        <div className="custom-select" title="החלף תצוגה">
            <div 
                className="select-selected" 
                onClick={() => setIsOpen(!isOpen)}
            >
                {translateRole(activeRole)}
            </div>
            <div className={`select-items ${isOpen ? '' : 'select-hide'}`}>
                {allUserRoles.map(role => (
                    <div 
                        key={role} 
                        className="select-item"
                        onClick={() => handleRoleChange(role)}
                    >
                        {translateRole(role)}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default RoleSwitcher;