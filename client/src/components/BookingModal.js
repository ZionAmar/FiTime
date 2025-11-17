import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ConfirmModal from './ConfirmModal'; // 1. ייבוא המודל החדש
import '../styles/UserModal.css'; 

function BookingModal({ event, onClose, onSave }) {
    const { user, activeRole } = useAuth();
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // 2. הסרת ה-state הישן
    // const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
    // const [isConfirmingWaitlist, setIsConfirmingWaitlist] = useState(false);

    // 3. הוספת state חדש עבור מודל האישור
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        confirmText: 'אישור',
        confirmButtonType: 'btn-primary'
    });

    const isEventInPast = event.start < new Date();

    // 4. פונקציית עזר לסגירת מודל האישור
    const closeConfirmModal = () => {
        setConfirmState({ isOpen: false });
    };

    // 5. פונקציה חדשה שמכילה את לוגיקת הרישום
    const performRegister = async (forceWaitlist = false) => {
        closeConfirmModal(); // סגור את מודל האישור (אם היה פתוח)
        setError('');
        setIsSubmitting(true);
        try {
            const payload = { 
                meetingId: event.id, 
                forceWaitlist: forceWaitlist 
            };
            const result = await api.post('/api/participants', payload);
            onSave(); // סוגר את מודל השיעור
        } catch (err) {
            const serverResponse = err.response?.data;
            
            if (serverResponse && serverResponse.errorType === 'CLASS_FULL') {
                // אם השיעור מלא, פתח מודל אישור להמתנה
                setConfirmState({
                    isOpen: true,
                    title: 'השיעור מלא',
                    message: `${serverResponse.message} האם תרצה להצטרף לרשימת ההמתנה?`,
                    onConfirm: () => performRegister(true), // קורא לעצמו עם אישור להמתנה
                    confirmText: 'כן, הוסף להמתנה',
                    confirmButtonType: 'btn-warning'
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

    // 6. עדכון: פונקציה זו קוראת רק ל-performRegister
    const handleRegister = () => {
        performRegister(false);
    };

    // 7. פונקציה חדשה שמבצעת את הביטול בפועל
    const performCancel = async () => {
        closeConfirmModal();
        setIsSubmitting(true);
        setError('');
        try {
            await api.delete(`/api/participants/${event.registrationId}`);
            onSave(); // סוגר את מודל השיעור
        } catch (err) {
            setError(err.message || 'שגיאה בביטול ההרשמה.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 8. עדכון: פונקציה זו פותחת את מודל האישור
    const handleCancel = () => {
        if (!event.registrationId) {
            setError("שגיאה: לא נמצא מזהה הרשמה לביטול.");
            return;
        }
        
        setError(''); // נקה שגיאות קודמות
        setConfirmState({
            isOpen: true,
            title: 'אישור ביטול הרשמה',
            message: 'האם אתה בטוח שברצונך לבטל את הרשמתך לשיעור זה?',
            onConfirm: performCancel,
            confirmText: 'כן, בטל הרשמה',
            confirmButtonType: 'btn-danger'
        });
    };
    
    // 9. עדכון: פונקציית הסגירה הראשית
    const handleClose = () => {
        setError('');
        closeConfirmModal(); // סגור גם את מודל האישור אם פתוח
        onClose(); // סגור את מודל השיעור
    };


    // 10. פישוט renderActionButtons (אין צורך בבדיקות כפולות)
    const renderActionButtons = () => {
        if (isEventInPast) {
            return <p><strong>שיעור זה כבר התקיים.</strong></p>;
        }

        if (!user || activeRole !== 'member') {
            return <p><strong>יש להתחבר כמתאמן כדי להירשם.</strong></p>;
        }

        if (event.isMyEvent) {
            return (
                <button 
                    onClick={handleCancel} 
                    className="btn cancel-btn" // קלאס פשוט
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'מבטל...' : 'בטל הרשמה'}
                </button>
            );
        }
        
        if (event.status === 'waiting' || event.status === 'pending') {
            return (
                <>
                    <p><strong>
                        {event.status === 'waiting' ? 'אתה נמצא ברשימת ההמתנה.' : 'המקום שלך ממתין לאישור.'}
                    </strong></p>
                    <button 
                        onClick={handleCancel} // גם כאן, פשוט פותח מודל
                        className="btn cancel-btn"
                        disabled={isSubmitting}
                        style={{marginTop: '10px'}}
                    >
                        {isSubmitting ? 'מבטל...' : 'בטל הרשמה מההמתנה'}
                    </button>
                </>
            );
        }
        
        const isFull = (event.participant_count >= event.capacity);
        
        if (isFull) {
            const count = event.waiting_list_count || 0;
            const msg = count > 0 ? `השיעור מלא. כבר יש ${count} ברשימת ההמתנה.` : 'השיעור מלא.';
            return (
                <>
                    <p><strong>{msg}</strong></p>
                    {/* קריאה רגילה ל-handleRegister, והוא יטפל בפתיחת המודל */}
                    <button onClick={handleRegister} className="btn btn-warning" disabled={isSubmitting}>
                        {isSubmitting ? 'מצטרף...' : 'הצטרף לרשימת ההמתנה'}
                    </button>
                </>
            );
        }

        // אין צורך ב-isConfirmingWaitlist
        return (
            <button onClick={handleRegister} className="btn register-btn" disabled={isSubmitting}>
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
                    <h3>{event.title.split(' (')[0]}</h3>
                    <p><strong>מאמן/ה:</strong> {event.trainerName}</p>
                    <p><strong>חדר:</strong> {event.roomName}</p>
                    <p><strong>תאריך:</strong> {event.start.toLocaleDateString('he-IL')}</p>
                    <p><strong>שעה:</strong> {event.start.toTimeString().slice(0, 5)}</p>
                    
                    {/* עכשיו מציגים שגיאות בלבד, לא הודעות אישור */}
                    {error && <p className="error">{error}</p>}

                    <div className="modal-actions">
                        {renderActionButtons()}
                    </div>
                </div>
            </div>

            {/* 11. הוספת המודל החדש לדף */}
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