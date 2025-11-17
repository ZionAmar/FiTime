import React, { useState, useEffect } from 'react';
import api from '../services/api';
import ConfirmModal from './ConfirmModal'; // 1. ייבוא המודל החדש
import '../styles/UserModal.css';

function StudioModal({ studio, onClose, onSave }) {
    const isEditMode = Boolean(studio);
    const [formData, setFormData] = useState({
        name: '', address: '', phone_number: '', subscription_status: 'trialing',
        admin_full_name: '', admin_email: '', admin_userName: '', admin_password: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [initializationError, setInitializationError] = useState('');

    const [createMode, setCreateMode] = useState('newAdmin');
    const [allUsers, setAllUsers] = useState([]);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [selectedExistingAdminId, setSelectedExistingAdminId] = useState('');
    const [currentAdmin, setCurrentAdmin] = useState(null);
    const [selectedNewAdminId, setSelectedNewAdminId] = useState('');

    // 2. החלפת ה-state הישן
    // const [isConfirmingAdminAssign, setIsConfirmingAdminAssign] = useState(false);

    // 3. הוספת state חדש למודל האישור
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {}
    });


    useEffect(() => {
        // ... (ה-useEffect נשאר זהה) ...
        const initializeModal = async () => {
            setIsLoading(true);
            setInitializationError('');
            try {
                const users = await api.get('/api/users/all');
                setAllUsers(users || []);

                if (isEditMode && studio) {
                    setFormData({
                        name: studio.name || '',
                        address: studio.address || '',
                        phone_number: studio.phone_number || '',
                        subscription_status: studio.subscription_status || 'trialing',
                    });

                    const usersInStudio = await api.get(`/api/users/by-studio/${studio.id}`);
                    const adminUser = usersInStudio.find(u => {
                        try {
                            const roles = typeof u.roles === 'string' ? JSON.parse(u.roles) : u.roles;
                            return Array.isArray(roles) && roles.some(r => r.studio_id === studio.id && r.role === 'admin');
                        } catch { return false; }
                    });
                    setCurrentAdmin(adminUser);
                }
            } catch (err) {
                setInitializationError(err.message || 'שגיאה בטעינת הנתונים. אנא סגור ונסה שוב.');
            } finally {
                setIsLoading(false);
            }
        };

        initializeModal();
    }, [studio, isEditMode]);

    // 4. פונקציית עזר לסגירת מודל האישור
    const closeConfirmModal = () => {
        setConfirmState({ isOpen: false });
    };

    const resetErrors = () => {
        setError('');
        setFieldErrors({});
        closeConfirmModal();
    };

    const handleChange = (e) => {
        resetErrors();
        if (fieldErrors[e.target.name]) {
            setFieldErrors(prev => ({ ...prev, [e.target.name]: null }));
        }
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCreateModeChange = (mode) => {
        resetErrors();
        setCreateMode(mode);
    };

    const validateForm = () => {
        // ... (הפונקציה נשארת זהה) ...
        if (!formData.name.trim()) {
            setFieldErrors({ name: "שם הסטודיו הוא שדה חובה." });
            return false;
        }
        if (!isEditMode) { 
            if (createMode === 'newAdmin') {
                if (!formData.admin_full_name.trim() || !formData.admin_userName.trim() || !formData.admin_email.trim() || !formData.admin_password) {
                    setError("אנא מלא את כל פרטי המנהל החדש.");
                    return false;
                }
            } else if (createMode === 'existingUser' && !selectedExistingAdminId) {
                setFieldErrors({ existingAdminId: "אנא בחר מנהל קיים מהרשימה." });
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async (e) => {
        // ... (הפונקציה נשארת זהה) ...
        e.preventDefault();
        resetErrors();
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            if (isEditMode) {
                const { name, address, phone_number, subscription_status } = formData;
                await api.put(`/api/studio/${studio.id}`, { name, address, phone_number, subscription_status });
            } else {
                const payload = {
                    createMode,
                    name: formData.name, address: formData.address, phone_number: formData.phone_number,
                };
                if (createMode === 'newAdmin') {
                    Object.assign(payload, {
                        admin_full_name: formData.admin_full_name,
                        admin_email: formData.admin_email,
                        admin_userName: formData.admin_userName,
                        admin_password: formData.admin_password,
                    });
                } else {
                    payload.existingAdminId = selectedExistingAdminId;
                }
                await api.post('/api/studio', payload);
            }
            onSave();
        } catch (err) {
            const serverResponse = err.response?.data;
            if (serverResponse && serverResponse.field) {
                setFieldErrors({ [serverResponse.field]: serverResponse.message });
            } else {
                setError(err.message || 'שגיאה לא צפויה. נסה שוב.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // 5. פונקציה שמבצעת את ההחלפה בפועל
    const performAssignNewAdmin = async () => {
        closeConfirmModal();
        setIsLoading(true);
        resetErrors();
        try {
            await api.put(`/api/studio/${studio.id}/assign-admin`, { newAdminId: selectedNewAdminId });
            onSave();
        } catch (err) {
            setError(err.message || 'שגיאה בהחלפת המנהל.');
        } finally {
            setIsLoading(false);
        }
    };
    
    // 6. פונקציה שפותחת את מודל האישור
    const handleAssignNewAdmin = async () => {
        if (!selectedNewAdminId) return;

        const newAdmin = allUsers.find(u => u.id == selectedNewAdminId);
        if (!newAdmin) return setError('משתמש לא נמצא.');

        setConfirmState({
            isOpen: true,
            title: 'אישור החלפת מנהל',
            message: `פעולה זו תסיר את המנהל הנוכחי (${currentAdmin?.full_name || 'ללא'}) ותשייך את ${newAdmin.full_name} כמנהל הראשי של ${studio.name}. האם להמשיך?`,
            onConfirm: performAssignNewAdmin,
            confirmText: 'כן, החלף',
            confirmButtonType: 'btn-danger'
        });
    };

    // 7. פונקציה שפותחת את מודל מחיקת הסטודיו (חדש)
    const handleDeleteStudioClick = () => {
        setConfirmState({
            isOpen: true,
            title: 'אזהרה: מחיקת סטודיו',
            message: `פעולה זו תמחק לצמיתות את כל הנתונים, השיעורים והמשתמשים המשויכים לסטודיו "${studio.name}". אין דרך חזרה.`,
            onConfirm: performDeleteStudio,
            confirmText: 'כן, מחק לצמיתות',
            confirmButtonType: 'btn-danger'
        });
    };

    // 8. פונקציה שמבצעת את מחיקת הסטודיו (חדש)
    const performDeleteStudio = async () => {
        closeConfirmModal();
        setIsLoading(true);
        resetErrors();
        try {
            await api.delete(`/api/studio/${studio.id}`);
            onSave();
        } catch (err) {
            setError(err.message || 'שגיאה במחיקת הסטודיו.');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredUsers = allUsers.filter(user =>
        user.full_name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
    );

    if (initializationError) {
        // ... (קוד טיפול בשגיאת אתחול נשאר זהה) ...
        return (
            <div className="modal-overlay">
                <div className="modal-content" style={{ padding: '2rem', textAlign: 'center' }}>
                    <p className="error" style={{ color: 'red' }}>{initializationError}</p>
                    <button className="btn btn-secondary" onClick={onClose}>סגור</button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" style={{maxWidth: '600px'}}>
                    <button className="modal-close-btn" onClick={onClose} disabled={isLoading}>&times;</button>
                    <h2>{isEditMode ? `עריכת סטודיו: ${studio.name}` : 'הוספת סטודיו חדש'}</h2>
                    
                    <form onSubmit={handleSubmit} className="settings-form">
                        {/* ... (כל ה-fieldset-ים נשארים זהים) ... */}
                        <fieldset disabled={isLoading}>
                            <legend>פרטי הסטודיו</legend>
                            <div className="form-field">
                                <label>שם הסטודיו</label>
                                <input name="name" value={formData.name} onChange={handleChange} required />
                                {fieldErrors.name && <p className="error field-error">{fieldErrors.name}</p>}
                            </div>
                            <div className="form-field"><label>כתובת</label><input name="address" value={formData.address} onChange={handleChange} /></div>
                            <div className="form-field"><label>מספר טלפון</label><input name="phone_number" value={formData.phone_number} onChange={handleChange} /></div>
                            {isEditMode && (
                                <div className="form-field">
                                    <label>סטטוס מנוי</label>
                                    <select name="subscription_status" value={formData.subscription_status} onChange={handleChange}>
                                        <option value="trialing">בתקופת ניסיון</option>
                                        <option value="active">פעיל</option>
                                        <option value="past_due">בפיגור תשלום</option>
                                        <option value="canceled">בוטל</option>
                                    </select>
                            </div>
                        )}
                    </fieldset>

                    {!isEditMode && (
                        <>
                            <div className="create-mode-toggle" style={{ display: 'flex', gap: '10px', margin: '1.5rem 0' }}>
                                <button type="button" className={`btn ${createMode === 'newAdmin' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => handleCreateModeChange('newAdmin')} disabled={isLoading}>צור מנהל חדש</button>
                                <button type="button" className={`btn ${createMode === 'existingUser' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => handleCreateModeChange('existingUser')} disabled={isLoading}>בחר משתמש קיים</button>
                            </div>

                            {createMode === 'newAdmin' && (
                                <fieldset disabled={isLoading}>
                                    <legend>פרטי מנהל חדש</legend>
                                    <div className="form-field">
                                        <label>שם מלא</label>
                                        <input name="admin_full_name" value={formData.admin_full_name} onChange={handleChange} required />
                                    </div>
                                    <div className="form-field">
                                        <label>שם משתמש</label>
                                        <input name="admin_userName" value={formData.admin_userName} onChange={handleChange} required />
                                        {fieldErrors.admin_userName && <p className="error field-error">{fieldErrors.admin_userName}</p>}
                                    </div>
                                    <div className="form-field">
                                        <label>אימייל</label>
                                        <input name="admin_email" type="email" value={formData.admin_email} onChange={handleChange} required />
                                        {fieldErrors.admin_email && <p className="error field-error">{fieldErrors.admin_email}</p>}
                                    </div>
                                    <div className="form-field">
                                        <label>סיסמה</label>
                                        <input name="admin_password" type="password" value={formData.admin_password} onChange={handleChange} required />
                                    </div>
                                </fieldset>
                            )}

                            {createMode === 'existingUser' && (
                                <fieldset disabled={isLoading}>
                                    <legend>בחר מנהל מהרשימה</legend>
                                    <div className="form-field"><input type="text" placeholder="חפש משתמש..." className="search-input-modal" value={userSearchTerm} onChange={(e) => setUserSearchTerm(e.target.value)} /></div>
                                    <div className="form-field">
                                        <label>בחר משתמש</label>
                                        <select value={selectedExistingAdminId} onChange={(e) => setSelectedExistingAdminId(e.target.value)} required>
                                            <option value="">בחר...</option>
                                            {filteredUsers.map(user => (<option key={user.id} value={user.id}>{user.full_name} ({user.email})</option>))}
                                        </select>
                                        {fieldErrors.existingAdminId && <p className="error field-error">{fieldErrors.existingAdminId}</p>}
                                    </div>
                                </fieldset>
                            )}
                        </>
                    )}
                    
                    {error && <p className="error" style={{ color: 'red', marginTop: '1rem', textAlign: 'center' }}>{error}</p>}
                    <div className="modal-actions">
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? 'שומר...' : 'שמור שינויים'}</button>
                    </div>
                </form>

                {isEditMode && (
                    <div className="admin-management-section">
                        <hr />
                        <h4>ניהול מנהל הסטודיו</h4>
                        <p><strong>מנהל נוכחי:</strong> {currentAdmin ? `${currentAdmin.full_name} (${currentAdmin.email})` : 'אין מנהל משויך'}</p>
                        <fieldset disabled={isLoading}>
                            <div className="form-field">
                                <label>החלף מנהל למשתמש קיים:</label>
                                <select value={selectedNewAdminId} onChange={(e) => { setSelectedNewAdminId(e.target.value); resetErrors(); }}>
                                    <option value="">בחר משתמש...</option>
                                    {allUsers.filter(u => u.id !== currentAdmin?.id).map(user => (<option key={user.id} value={user.id}>{user.full_name} ({user.email})</option>))}
                                </select>
                            </div>
                        </fieldset>
                        <div className="modal-actions" style={{justifyContent: 'space-between'}}>
                            <button 
                                className="btn btn-secondary"
                                onClick={handleAssignNewAdmin} 
                                disabled={!selectedNewAdminId || isLoading}>
                                {isLoading ? 'מעדכן...' : 'הפוך למנהל'}
                            </button>
                            
                            {/* 9. הוספת כפתור מחיקה */}
                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={handleDeleteStudioClick} 
                                disabled={isLoading}
                            >
                                מחק סטודיו
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* 10. הוספת המודל החדש לדף */}
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

export default StudioModal;