import React from 'react';
import '../styles/ConfirmModal.css';

/**
 * מודל אישור רב-שימושי
 * @param {boolean} isOpen - האם המודל פתוח
 * @param {string} title - הכותרת (לדוגמה: "אישור מחיקה")
 * @param {string} message - גוף ההודעה (לדוגמה: "האם אתה בטוח...?")
 * @param {function} onConfirm - הפונקציה שתרוץ בלחיצה על "אישור"
 * @param {function} onCancel - הפונקציה שתרוץ בלחיצה על "ביטול"
 * @param {string} confirmText - (אופציונלי) הטקסט לכפתור האישור
 * @param {string} cancelText - (אופציונלי) הטקסט לכפתור הביטול
 * @param {string} confirmButtonType - (אופציונלי) סוג הכפתור (למשל 'btn-danger')
 */
function ConfirmModal({ 
    isOpen, 
    title, 
    message, 
    onConfirm, 
    onCancel, 
    confirmText = 'אישור', 
    cancelText = 'ביטול',
    confirmButtonType = 'btn-primary' 
}) {
    if (!isOpen) return null;

    return (
        <div className="confirm-modal-overlay" onClick={onCancel}>
            <div className="confirm-modal-content" onClick={e => e.stopPropagation()}>
                
                <button className="modal-close-btn" onClick={onCancel}>&times;</button>
                
                <div className="confirm-modal-header">
                    <h2>{title}</h2>
                </div>
                
                <div className="confirm-modal-body">
                    <p>{message}</p>
                </div>
                
                <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button className={`btn ${confirmButtonType}`} onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
                
            </div>
        </div>
    );
}

export default ConfirmModal;