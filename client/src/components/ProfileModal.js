import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../styles/UserModal.css'; 

function ProfileModal({ isOpen, onClose, onOpenChangePassword }) { 
    const { user, refreshUser } = useAuth();
    const [formData, setFormData] = useState({ full_name: '', phone: '' });
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const fileInputRef = useRef();
    const [isImageDeleted, setIsImageDeleted] = useState(false);

    useEffect(() => {
        if (user && isOpen) {
            setFormData({
                full_name: user.full_name || '',
                phone: user.phone || '',
            });
            setPreview(user.profile_picture_url || null);
            setSelectedFile(null);
            setIsImageDeleted(false);
            setError('');
            setFieldErrors({});
        }
    }, [user, isOpen]);

    useEffect(() => {
        if (isImageDeleted) {
            setPreview(null);
            return;
        }
        if (!selectedFile) {
            if (!isImageDeleted && user?.profile_picture_url) {
                setPreview(user.profile_picture_url);
            } else {
                setPreview(null);
            }
            return;
        }
        const objectUrl = URL.createObjectURL(selectedFile);
        setPreview(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [selectedFile, user, isImageDeleted]);

    if (!isOpen) return null;

    const resetErrors = () => {
        setError('');
        setFieldErrors({});
    };

    const handleFileChange = (e) => {
        resetErrors();
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
            setIsImageDeleted(false);
        }
    };

    const handleChange = (e) => {
        resetErrors();
        if (fieldErrors[e.target.name]) {
            setFieldErrors(prev => ({ ...prev, [e.target.name]: null }));
        }
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleRemoveImage = () => {
        resetErrors();
        setSelectedFile(null);
        setIsImageDeleted(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        resetErrors();

        const data = new FormData();
        data.append('full_name', formData.full_name);
        data.append('phone', formData.phone);
        if (selectedFile) {
            data.append('profile_picture', selectedFile);
        }
        data.append('delete_image', isImageDeleted);

        try {
            await api.put('/api/users/profile', data);
            await refreshUser(); 
            onClose(); 
        } catch (err) {
            const serverResponse = err.response?.data;
            if (serverResponse && serverResponse.field) {
                setFieldErrors({ [serverResponse.field]: serverResponse.message });
            } else {
                setError(err.message || 'שגיאה בעדכון הפרופיל.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>&times;</button>
                <h2>עריכת פרופיל</h2>
                <form onSubmit={handleSave} className="settings-form">
                    
                    <div className="form-field profile-picture-field">
                        <label>תמונת פרופיל</label>
                        <div className="profile-picture-preview">
                            {preview ? (
                                <img src={preview} alt="תצוגה מקדימה" />
                            ) : (
                                <div className="placeholder-avatar">{user?.full_name?.charAt(0)}</div>
                            )}
                            
                            {preview && !isLoading && (
                                <button
                                    type="button"
                                    className="remove-image-btn"
                                    title="הסר תמונה"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveImage();
                                    }}
                                >
                                    🗑️
                                </button>
                            )}

                            <button
                                type="button"
                                className="edit-image-btn"
                                title="שנה תמונה"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    fileInputRef.current.click();
                                }}
                            >
                                ✏️
                            </button>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
                    </div>

                    <div className="form-field">
                        <label>אימייל</label>
                        <input type="email" name="email" value={user?.email || ''} disabled />
                    </div>

                    <div className="form-field">
                        <label>שם מלא</label>
                        <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} required />
                        {fieldErrors.full_name && <p className="error field-error">{fieldErrors.full_name}</p>}
                    </div>
                    <div className="form-field">
                        <label>טלפון</label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} />
                        {fieldErrors.phone && <p className="error field-error">{fieldErrors.phone}</p>}
                    </div>
                    
                    {error && <p className="error general-error">{error}</p>}

                    <div className="modal-actions-profile">
                        {/* FIX: תיקון כפתור ראשי */}
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                            {isLoading ? 'שומר...' : 'שמור שינויים'}
                        </button>
                        {/* FIX: תיקון כפתור משני */}
                        <button type="button" className="btn btn-secondary" onClick={onOpenChangePassword} disabled={isLoading}>
                            שנה סיסמה
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}

export default ProfileModal;