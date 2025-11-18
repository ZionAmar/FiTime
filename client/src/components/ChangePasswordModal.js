import React, { useState } from 'react';
import api from '../services/api';
import '../styles/UserModal.css'; 

function ChangePasswordModal({ isOpen, onClose }) {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
        setMessage('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.newPassword !== formData.confirmPassword) {
            setError('הסיסמאות החדשות אינן תואמות.');
            return;
        }

        if (formData.newPassword.length < 6) {
            setError('הסיסמה החדשה חייבת להכיל לפחות 6 תווים.');
            return;
        }

        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            await api.put('/api/users/profile/change-password', {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword
            });
            
            setMessage('הסיסמה שונתה בהצלחה!');
            setTimeout(() => {
                onClose(); 
                setMessage('');
                setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            }, 2000);

        } catch (err) {
            setError(err.response?.data?.message || err.message || 'שגיאה בעדכון הסיסמה.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>&times;</button>
                <h2>שינוי סיסמה</h2>
                <form onSubmit={handleSubmit} className="settings-form">
                    <div className="form-field">
                        <label>סיסמה נוכחית</label>
                        <input 
                            type="password" 
                            name="currentPassword" 
                            value={formData.currentPassword} 
                            onChange={handleChange} 
                            required 
                            disabled={isLoading}
                        />
                    </div>
                    <div className="form-field">
                        <label>סיסמה חדשה</label>
                        <input 
                            type="password" 
                            name="newPassword" 
                            value={formData.newPassword} 
                            onChange={handleChange} 
                            required 
                            disabled={isLoading}
                        />
                    </div>
                    <div className="form-field">
                        <label>אישור סיסמה חדשה</label>
                        <input 
                            type="password" 
                            name="confirmPassword" 
                            value={formData.confirmPassword} 
                            onChange={handleChange} 
                            required 
                            disabled={isLoading}
                        />
                    </div>
                    
                    {error && <p className="error">{error}</p>}
                    {message && <p style={{ color: 'green' }}>{message}</p>}

                    <div className="modal-actions">
                        {/* FIX: תיקון כפתור */}
                        <button type="submit" className="btn btn-primary" disabled={isLoading || message}>
                            {isLoading ? 'משנה...' : 'שמור סיסמה חדשה'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ChangePasswordModal;