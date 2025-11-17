import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from './ConfirmModal';
import '../styles/UserModal.css';
import '../styles/AdminTabs.css'; 

function MembershipsTab({ user, products }) {
    const [memberships, setMemberships] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const [selectedProductId, setSelectedProductId] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]); 

    const fetchMemberships = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const data = await api.get(`/api/memberships/user/${user.id}`);
            setMemberships(data);
            setError('');
        } catch (err) {
            setError(err.message || 'שגיאה בטעינת מנויים');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMemberships();
    }, [user]);

    const handleAddMembership = async (e) => {
        e.preventDefault();
        setError('');
        if (!selectedProductId) {
            setError('חובה לבחור סוג מנוי.');
            return;
        }

        setIsLoading(true);
        try {
            await api.post('/api/memberships', {
                user_id: user.id,
                studio_product_id: selectedProductId,
                start_date: startDate
            });
            fetchMemberships(); 
            setSelectedProductId(''); 
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'שגיאה בהוספת המנוי');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="memberships-tab">
            <h4>מנויים קיימים</h4>
            {isLoading && <p>טוען מנויים...</p>}
            {error && <p className="error" style={{ color: 'red' }}>{error}</p>}
            
            <ul className="memberships-list">
                {memberships.length === 0 && !isLoading && <p style={{ padding: '10px', textAlign: 'center' }}>למתאמן זה אין מנויים פעילים.</p>}
                {memberships.map(mem => (
                    <li key={mem.id}>
                        <div>
                            <strong>{mem.product_name}</strong>
                            <div style={{ fontSize: '0.9rem', color: '#666' }}>סטטוס: {mem.status}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.9rem', color: '#666' }}>
                                ניקובים: {mem.visits_remaining === null ? 'ללא הגבלה' : `${mem.visits_remaining} / ${mem.total_visits || '?'}`}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#666' }}>
                                תוקף: {mem.expiry_date ? new Date(mem.expiry_date).toLocaleDateString('he-IL') : 'ללא הגבלה'}
                            </div>
                        </div>
                    </li>
                ))}
            </ul>

            <hr />
            
            <h4>הוספת מנוי חדש</h4>
            <form onSubmit={handleAddMembership} className="add-membership-form">
                <div className="form-field">
                    <label>בחר מנוי/כרטיסייה:</label>
                    <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} required>
                        <option value="">בחר...</option>
                        {products.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.name} (₪{p.price})
                            </option>
                        ))}
                    </select>
                </div>
                <div className="form-field">
                    <label>תאריך התחלה:</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                    {isLoading ? 'מוסיף...' : 'הוסף מנוי'}
                </button>
            </form>
        </div>
    );
}

function UserModal({ user, onSave, onClose, defaultRole }) {
    const { activeStudio } = useAuth();
    const isEditMode = Boolean(user);
    const [activeTab, setActiveTab] = useState('details'); 

    const [formData, setFormData] = useState({
        full_name: '', email: '', phone: '', userName: '', pass: '', roles: []
    });
    const [assignableRoles, setAssignableRoles] = useState([]);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const [confirmState, setConfirmState] = useState({ isOpen: false });
    
    const [availableProducts, setAvailableProducts] = useState([]);

    const closeConfirmModal = () => {
        setConfirmState({ isOpen: false });
        setError('');
    };

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const rolesData = await api.get('/api/users/assignable-roles'); 
                setAssignableRoles(rolesData);
            } catch (err) {
                setError("שגיאה בטעינת רשימת התפקידים.");
            }
        };
        fetchRoles();

        const fetchProducts = async () => {
            try {
                const data = await api.get('/api/products');
                setAvailableProducts(data.filter(p => p.is_active)); 
            } catch (err) {
                console.error("Failed to fetch products for modal", err);
            }
        };
        
        if (isEditMode) {
            fetchProducts();
        }

        if (isEditMode && user && activeStudio) {
            let rolesArray = [];
            if (typeof user.roles === 'string') {
                try { rolesArray = JSON.parse(user.roles); } catch (e) { rolesArray = []; }
            } else if (Array.isArray(user.roles)) {
                rolesArray = user.roles;
            }

            const rolesForCurrentStudio = rolesArray
                .filter(r => r && r.studio_id === activeStudio.studio_id)
                .map(r => r.role || r.role_name)
                .filter(Boolean);

            setFormData({ ...user, pass: '', roles: rolesForCurrentStudio });
        } else {
            setFormData({
                full_name: '', email: '', phone: '', userName: '', pass: '', 
                roles: [defaultRole]
            });
        }
    }, [user, isEditMode, activeStudio, defaultRole]);

    const resetErrors = () => {
        setError('');
        setFieldErrors({});
    };

    const handleChange = (e) => {
        resetErrors();
        if (fieldErrors[e.target.name]) {
            setFieldErrors(prev => ({ ...prev, [e.target.name]: null }));
        }
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRoleChange = (roleName) => {
        resetErrors();
        const currentRoles = formData.roles || [];
        const newRoles = currentRoles.includes(roleName)
            ? currentRoles.filter(r => r !== roleName)
            : [...currentRoles, roleName];
        setFormData({ ...formData, roles: newRoles });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        resetErrors();
        try {
            if (isEditMode) {
                const dataToSend = { ...formData };
                if (!dataToSend.pass) {
                    delete dataToSend.pass;
                }
                await api.put(`/api/users/${user.id}`, dataToSend);
            } else {
                const payload = { ...formData, roles: [defaultRole] };
                await api.post('/api/users', payload);
            }
            onSave();
        } catch (err) {
            const serverResponse = err.response?.data;
            if (serverResponse && serverResponse.field) {
                setFieldErrors({ [serverResponse.field]: serverResponse.message });
            } else {
                setError(err.message || 'An error occurred');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const performDelete = async () => {
        closeConfirmModal();
        setIsLoading(true);
        resetErrors();
        try {
            await api.delete(`/api/users/${user.id}`);
            onSave();
        } catch (err) {
            setError(err.message || 'שגיאה במחיקת המשתמש.');
            setIsLoading(false);
        }
    };

    const handleDelete = () => {
        resetErrors();
        setConfirmState({
            isOpen: true,
            title: `אישור מחיקת ${defaultRole === 'trainer' ? 'מאמן' : 'מתאמן'}`,
            message: `האם אתה בטוח שברצונך למחוק את ${formData.full_name}? פעולה זו היא סופית.`,
            onConfirm: performDelete,
            confirmText: 'כן, מחק לצמיתות',
            confirmButtonType: 'btn-danger'
        });
    };

    const title = isEditMode 
        ? (defaultRole === 'trainer' ? 'עריכת פרטי מאמן' : 'עריכת פרטי מתאמן')
        : (defaultRole === 'trainer' ? 'הוספת מאמן חדש' : 'הוספת מתאמן חדש');
        
    const deleteButtonText = defaultRole === 'trainer' ? 'מחק מאמן' : 'מחק מתאמן';

    return (
        <>
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '500px'}}>
                    <div className="modal-header">
                        <h2>{title}</h2>
                        <button className="modal-close-btn" onClick={onClose}>&times;</button>
                    </div>
                    
                    <div className="admin-tabs">
                        <button 
                            className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
                            onClick={() => setActiveTab('details')}>
                            פרטים
                        </button>
                        {isEditMode && defaultRole === 'member' && ( 
                            <button 
                                className={`tab-btn ${activeTab === 'memberships' ? 'active' : ''}`}
                                onClick={() => setActiveTab('memberships')}>
                                מנויים
                            </button>
                        )}
                    </div>

                    <div className="tab-content">
                        {activeTab === 'details' && (
                            <>
                                <form id="user-form" onSubmit={handleSubmit} className="user-form">
                                    <fieldset disabled={isLoading}>
                                        <div className="form-field">
                                            <label>שם מלא</label>
                                            <input name="full_name" value={formData.full_name || ''} onChange={handleChange} required />
                                        </div>
                                        <div className="form-field">
                                            <label>שם משתמש</label>
                                            <input name="userName" value={formData.userName || ''} onChange={handleChange} required disabled={isEditMode}/>
                                            {fieldErrors.userName && <p className="error field-error">{fieldErrors.userName}</p>}
                                        </div>
                                        <div className="form-field">
                                            <label>אימייל</label>
                                            <input type="email" name="email" value={formData.email || ''} onChange={handleChange} required />
                                            {fieldErrors.email && <p className="error field-error">{fieldErrors.email}</p>}
                                        </div>
                                        <div className="form-field">
                                            <label>טלפון</label>
                                            <input name="phone" value={formData.phone || ''} onChange={handleChange} required />
                                        </div>
                                        <div className="form-field">
                                            <label>{isEditMode ? 'סיסמה חדשה (אופציונלי)' : 'סיסמה'}</label>
                                            <input type="password" name="pass" value={formData.pass || ''} onChange={handleChange} required={!isEditMode} />
                                        </div>

                                        {isEditMode && (
                                            <div className="form-field">
                                                <label>תפקידים</label>
                                                <div className="roles-checkbox-group">
                                                    {assignableRoles.map(role => (
                                                        <div key={role.id} className="checkbox-item">
                                                            <input 
                                                                type="checkbox" 
                                                                id={`role-${role.name}-${user?.id || 'new'}`} 
                                                                checked={(formData.roles || []).includes(role.name)} 
                                                                onChange={() => handleRoleChange(role.name)} 
                                                            />
                                                            <label htmlFor={`role-${role.name}-${user?.id || 'new'}`}>{role.name}</label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {error && <p className="error">{error}</p>}
                                        {isEditMode && (
                                            <div className="danger-zone">
                                                <h4>אזהרה</h4>
                                                <p>מחיקת משתמש היא פעולה קבועה. הפעולה תסיר את הפרופיל וכל המידע המשויך אליו.</p>
                                                <button 
                                                    type="button" 
                                                    className="btn btn-danger" 
                                                    onClick={handleDelete} 
                                                    disabled={isLoading}
                                                >
                                                    {deleteButtonText}
                                                </button>
                                            </div>
                                        )}
                                    </fieldset>
                                </form>

                                <div className="modal-actions">
                                    <button type="submit" form="user-form" className="cta-button-pro" disabled={isLoading}>
                                        {isLoading ? 'שומר...' : 'שמור שינויים'}
                                    </button>
                                </div>
                            </>
                        )}

                        {activeTab === 'memberships' && isEditMode && (
                            <MembershipsTab user={user} products={availableProducts} />
                        )}
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmState.isOpen}
                title={confirmState.title}
                message={confirmState.message}
                onConfirm={performDelete}
                onCancel={closeConfirmModal}
                confirmText={confirmState.confirmText || 'אישור'}
                cancelText="ביטול"
                confirmButtonType={confirmState.confirmButtonType || 'btn-danger'}
            />
        </>
    );
}

export default UserModal;