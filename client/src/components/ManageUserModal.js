import React, { useState, useEffect } from 'react';
import api from '../services/api';
import ConfirmModal from './ConfirmModal'; 
import '../styles/UserModal.css'; 

function ManageUserModal({ user, allStudios, onClose, onSave }) {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        status: 'active'
    });
    const [roles, setRoles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [newRoleStudioId, setNewRoleStudioId] = useState('');
    const [newRoleName, setNewRoleName] = useState('member');
    
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {}
    });

    useEffect(() => {
        if (user) {
            setFormData({
                full_name: user.full_name || '',
                email: user.email || '',
                status: user.status || 'active'
            });
            setRoles(user.roles || []);
        }
    }, [user]);
    
    const closeConfirmModal = () => {
        setConfirmState({ isOpen: false });
        setError('');
    };

        const handleRemoveRole = (studioId, roleName, studioName) => {
        setConfirmState({
            isOpen: true,
            title: 'אישור הסרת תפקיד',
            message: `האם להסיר את התפקיד '${roleName}' מהמשתמש ${user.full_name} בסטודיו '${studioName}'?`,
            onConfirm: () => performRemoveRole(studioId, roleName),
            confirmText: 'כן, הסר',
            confirmButtonType: 'btn-danger'
        });
    };
    
    const performRemoveRole = async (studioId, roleName) => {
        closeConfirmModal();
        setIsLoading(true);
        try {
            await api.delete(`/api/users/system/roles/${user.id}/${studioId}/${roleName}`);
            setRoles(currentRoles => currentRoles.filter(r => !(r.studio_id === studioId && r.role_name === roleName)));
            onSave();
        } catch (err) {
            setError(err.message || "שגיאה בהסרת התפקיד.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddRole = async () => {
        if (!newRoleStudioId) {
            setError('אנא בחר סטודיו.');
            return;
        }

        if (newRoleName === 'admin') {
            setConfirmState({
                isOpen: true,
                title: 'אישור הוספת מנהל',
                message: `פעולה זו תהפוך את ${user.full_name} למנהל/ת היחיד/ה של הסטודיו. כל מנהל אחר יוסר. האם להמשיך?`,
                onConfirm: () => performAddRole(true),
                confirmText: 'כן, הפוך למנהל',
                confirmButtonType: 'btn-danger'
            });
            return;
        }

        performAddRole(false);
    };

    const performAddRole = async (isAdmin) => {
        closeConfirmModal();
        setIsLoading(true);
        setError('');
        try {
            if (isAdmin) {
                await api.put(`/api/studio/${newRoleStudioId}/assign-admin`, { newAdminId: user.id });
            } else {
                await api.post(`/api/users/system/roles/${user.id}`, {
                    studioId: newRoleStudioId,
                    roleName: newRoleName
                });
            }
            onSave(); 
            onClose();
        } catch (err) {
            setError(err.message || "שגיאה בהוספת התפקיד.");
            setIsLoading(false); 
        } 
    };
    
    const handleDeleteUser = () => {
        setConfirmState({
            isOpen: true,
            title: 'אישור מחיקת משתמש',
            message: `האם אתה בטוח שברצונך למחוק את ${user.full_name}? פעולה זו תסיר את המשתמש לצמיתות מהמערכת. אין דרך חזרה.`,
            onConfirm: performDeleteUser,
            confirmText: 'כן, מחק לצמיתות',
            confirmButtonType: 'btn-danger'
        });
    };

    const performDeleteUser = async () => {
        closeConfirmModal();
        setIsLoading(true);
        setError('');
        try {
            await api.delete(`/api/users/system/delete/${user.id}`);
            onSave();
            onClose();
        } catch (err) {
            setError(err.message || "שגיאה במחיקת המשתמש.");
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        setError(''); 
        setFieldErrors({});
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSaveChanges = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setFieldErrors({});
        try {
            await api.put(`/api/users/system/update/${user.id}`, formData);
            onSave();
            onClose();
        } catch (err) {
            const serverResponse = err.response?.data;
            if (serverResponse && serverResponse.field) {
                setFieldErrors({ [serverResponse.field]: serverResponse.message });
                setError('');
            } else {
                setError(err.message || "שגיאה בעדכון פרטי המשתמש.");
            }
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="modal-overlay">
                <div className="modal-content" style={{maxWidth: '600px'}}>
                    <button className="modal-close-btn" onClick={onClose} disabled={isLoading}>&times;</button>
                    <h2>ניהול משתמש: {user.full_name}</h2>
                    <form onSubmit={handleSaveChanges} className="settings-form">
                        <fieldset disabled={isLoading}>
                            <legend>פרטים אישיים</legend>
                            <div className="form-field">
                                <label>שם מלא</label>
                                <input name="full_name" value={formData.full_name} onChange={handleChange} required />
                            </div>
                            <div className="form-field">
                                <label>אימייל</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                                {fieldErrors.email && <p className="error field-error">{fieldErrors.email}</p>}
                            </div>
                            <div className="form-field">
                                <label>שם משתמש</label>
                                <input value={user.userName || ''} disabled readOnly />
                            </div>
                            <div className="form-field">
                                <label>סטטוס</label>
                                <select name="status" value={formData.status} onChange={handleChange}>
                                    <option value="active">פעיל</option>
                                    <option value="suspended">מושעה</option>
                                </select>
                            </div>
                        </fieldset>
                        <div className="modal-actions">
                            <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? 'שומר...' : 'שמור שינויים'}</button>
                        </div>
                    </form>

                    <hr style={{margin: '2rem 0'}} />

                    <div className="roles-management">
                        <h4>ניהול תפקידים</h4>
                        <ul style={{listStyle: 'none', padding: 0, marginBottom: '1.5rem'}}>
                            {roles.map(role => (
                                <li key={`${role.studio_id}-${role.role_name}`} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderBottom: '1px solid #eee'}}>
                                    <span><strong>{role.studio_name}</strong> - {role.role_name}</span>
                                    <button 
                                        className="btn btn-danger" 
                                        style={{padding: '5px 10px', fontSize: '0.8rem'}} 
                                        onClick={() => handleRemoveRole(role.studio_id, role.role_name, role.studio_name)} 
                                        disabled={isLoading}>
                                        הסר
                                    </button>
                                </li>
                            ))}
                             {roles.length === 0 && <p style={{textAlign: 'center', opacity: 0.6}}>המשתמש לא משויך לאף סטודיו.</p>}
                        </ul>

                        <h5>הוסף תפקיד חדש</h5>
                        <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                            <select value={newRoleStudioId} onChange={(e) => { setNewRoleStudioId(e.target.value); setError(''); }} disabled={isLoading} style={{flex: 2}}>
                                <option value="">בחר סטודיו...</option>
                                {allStudios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <select value={newRoleName} onChange={(e) => { setNewRoleName(e.target.value); setError(''); }} disabled={isLoading} style={{flex: 1}}>
                                <option value="member">מתאמן</option>
                                <option value="trainer">מאמן</option>
                                <option value="admin">מנהל (ראשי)</option>
                            </select>
                            <button 
                                className="btn btn-secondary" 
                                onClick={handleAddRole} 
                                disabled={isLoading || !newRoleStudioId}>
                                הוסף
                            </button>
                        </div>
                    </div>

                    <div className="danger-zone" style={{marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--danger-color)'}}>
                        <h4>אזהרה</h4>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <p style={{opacity: 0.8, margin: 0}}>
                                מחיקת המשתמש היא פעולה סופית.
                            </p>
                            <button 
                                className="btn btn-danger" 
                                onClick={handleDeleteUser} 
                                disabled={isLoading}>
                                מחק משתמש
                            </button>
                        </div>
                    </div>

                    {error && <p className="error" style={{marginTop: '1rem'}}>{error}</p>}
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmState.isOpen}
                title={confirmState.title}
                message={confirmState.message}
                onConfirm={confirmState.onConfirm}
                onCancel={closeConfirmModal}
                confirmText={confirmState.confirmText || 'אישור'}
                cancelText="ביטול"
                confirmButtonType={confirmState.confirmButtonType || 'btn-danger'}
            />
        </>
    );
}

export default ManageUserModal;