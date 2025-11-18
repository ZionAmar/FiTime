import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ConfirmModal from './ConfirmModal'; 
import '../styles/UserModal.css'; 

function BookingModal({ event, onClose, onSave }) {
    const { user, activeRole } = useAuth();
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        confirmText: 'אישור',
        confirmButtonType: 'btn-primary'
    });

    const isEventInPast = event.start < new Date();

    const closeConfirmModal = () => {
        setConfirmState({ isOpen: false });
    };

    const performRegister = async (forceWaitlist = false) => {
        closeConfirmModal(); 
        setError('');
        setIsSubmitting(true);
        try {
            const payload = { 
                meetingId: event.id, 
                forceWaitlist: forceWaitlist 
            };
            await api.post('/api/participants', payload);
            onSave(); 
        } catch (err) {
            const serverResponse = err.response?.data;
            
            if (serverResponse && serverResponse.errorType === 'CLASS_FULL') {
                setConfirmState({
                    isOpen: true,
                    title: 'השיעור מלא',
                    message: `${serverResponse.message} האם תרצה להצטרף לרשימת ההמתנה?`,
                    onConfirm: () => performRegister(true), 
                    confirmText: 'כן, הוסף להמתנה',
                    confirmButtonType: 'btn-warning' // שימוש בכפתור צהוב
                });
            } else if (serverResponse && serverResponse.errorType === 'NO_MEMBERSHIP') {
                setError(serverResponse.message); 
            } else {
                setError(err.message || 'שגיאה בעת ההרשמה.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRegister = () => {
        performRegister(false);
    };

    const performCancel = async () => {
        closeConfirmModal();
        setIsSubmitting(true);
        setError('');
        try {
            await api.delete(`/api/participants/${event.registrationId}`);
            onSave(); 
        } catch (err) {
            setError(err.message || 'שגיאה בביטול ההרשמה.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (!event.registrationId) {
            setError("שגיאה: לא נמצא מזהה הרשמה לביטול.");
            return;
        }
        
        setError(''); 
        setConfirmState({
            isOpen: true,
            title: 'אישור ביטול הרשמה',
            message: 'האם אתה בטוח שברצונך לבטל את הרשמתך לשיעור זה?',
            onConfirm: performCancel,
            confirmText: 'כן, בטל הרשמה',
            confirmButtonType: 'btn-danger'
        });
    };
    
    const handleClose = () => {
        setError('');
        closeConfirmModal(); 
        onClose(); 
    };

    // רינדור הכפתורים בצורה נקייה
    const renderActionButtons = () => {
        if (isEventInPast) {
            return <p className="error" style={{width: '100%', textAlign: 'center'}}>שיעור זה כבר התקיים.</p>;
        }

        if (!user || activeRole !== 'member') {
            return <p className="error" style={{width: '100%', textAlign: 'center'}}>יש להתחבר כמתאמן כדי להירשם.</p>;
        }

        if (event.isMyEvent) {
            return (
                <button 
                    onClick={handleCancel} 
                    className="btn btn-danger" 
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'מבטל...' : 'בטל הרשמה'}
                </button>
            );
        }
        
        if (event.status === 'waiting' || event.status === 'pending') {
            return (
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px', width: '100%'}}>
                    <p style={{margin: 0, fontSize: '0.9rem', color: 'var(--primary-color)'}}>
                        {event.status === 'waiting' ? 'אתה נמצא ברשימת ההמתנה.' : 'המקום שלך ממתין לאישור.'}
                    </p>
                    <button 
                        onClick={handleCancel}
                        className="btn btn-danger"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'מבטל...' : 'בטל הרשמה מההמתנה'}
                    </button>
                </div>
            );
        }
        
        const isFull = (event.participant_count >= event.capacity);
        
        if (isFull) {
            const count = event.waiting_list_count || 0;
            const msg = count > 0 ? `השיעור מלא. כבר יש ${count} ברשימת ההמתנה.` : 'השיעור מלא.';
            return (
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px', width: '100%'}}>
                    <p style={{margin: 0, fontSize: '0.9rem', color: 'orange'}}>{msg}</p>
                    <button onClick={handleRegister} className="btn btn-secondary" disabled={isSubmitting} style={{borderColor: '#f59e0b', color: '#f59e0b'}}>
                        {isSubmitting ? 'מצטרף...' : 'הצטרף לרשימת ההמתנה'}
                    </button>
                </div>
            );
        }

        return (
            <button onClick={handleRegister} className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'רושם...' : 'הירשם לשיעור'}
            </button>
        );
    };

    return (
        <>
            <div className="modal-overlay" onClick={handleClose}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <button className="modal-close-btn" onClick={handleClose}>&times;</button>
                    <h2>פרטי השיעור</h2>
                    
                    <div className="settings-form">
                        <h3>{event.title.split(' (')[0]}</h3>
                        
                        <div className="modal-details-grid" style={{marginBottom: '1rem'}}>
                            <p><strong>מאמן/ה:</strong> {event.trainerName}</p>
                            <p><strong>חדר:</strong> {event.roomName}</p>
                            <p><strong>תאריך:</strong> {event.start.toLocaleDateString('he-IL')}</p>
                            <p><strong>שעה:</strong> {event.start.toTimeString().slice(0, 5)}</p>
                        </div>
                        
                        {error && <p className="error">{error}</p>}

                        {/* שימוש ב-modal-actions הסטנדרטי שלנו */}
                        <div className="modal-actions">
                            {renderActionButtons()}
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmState.isOpen}
                title={confirmState.title}
                message={confirmState.message}
                onConfirm={confirmState.onConfirm}
                onCancel={closeConfirmModal}
                confirmText={confirmState.confirmText}
                cancelText="ביטול"
                confirmButtonType={confirmState.confirmButtonType}
            />
        </>
    );
}

export default BookingModal;