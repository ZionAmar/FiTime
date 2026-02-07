import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom'; // <--- חובה להוסיף את זה עבור הפורטל
import api from '../services/api';
import MultiSelect from './MultiSelect';
import ConfirmModal from './ConfirmModal';
import '../styles/UserModal.css';

// --- רכיב פנימי לבחירת אופן הפעולה על סדרה (עם Portal) ---
const RecurrenceActionModal = ({ isOpen, onClose, onSelect, actionType }) => {
    if (!isOpen) return null;

    // שימוש ב-Portal כדי להציג את המודל מעל הכל (מחוץ להיררכיה הרגילה)
    return ReactDOM.createPortal(
        <div className="modal-overlay" style={{ 
            zIndex: 9999, 
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <div className="modal-content" style={{ 
                backgroundColor: 'white',
                padding: '25px',
                borderRadius: '8px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                maxWidth: '400px', 
                textAlign: 'center',
                position: 'relative',
                zIndex: 10000 
            }}>
                <h3 style={{ marginTop: 0, marginBottom: '15px' }}>
                    {actionType === 'delete' ? 'מחיקת שיעור חוזר' : 'עדכון שיעור חוזר'}
                </h3>
                <p style={{ marginBottom: '20px' }}>שיעור זה הוא חלק מסדרה. כיצד תרצה להחיל את השינוי?</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button className="btn btn-secondary" onClick={() => onSelect('single')}>
                        רק שיעור זה
                    </button>
                    <button className="btn btn-secondary" onClick={() => onSelect('future')}>
                        שיעור זה והבאים
                    </button>
                    <button className="btn btn-secondary" onClick={() => onSelect('all')}>
                        כל הסדרה
                    </button>
                </div>
                
                <button 
                    style={{ 
                        marginTop: '20px', 
                        background: 'none', 
                        border: 'none', 
                        textDecoration: 'underline', 
                        cursor: 'pointer', 
                        color: '#666' 
                    }} 
                    onClick={onClose}
                >
                    ביטול
                </button>
            </div>
        </div>,
        document.body // היעד של הפורטל
    );
};

function MeetingModal({ meeting, onSave, onClose, initialData, operatingHours }) {
    const isEditMode = Boolean(meeting);
    
    // זיהוי האם המפגש הוא חלק מסדרה
    const isSeries = meeting?.group_id ? true : false;

    const [formData, setFormData] = useState({
        name: '', date: '', start_time: '', end_time: '',
        trainer_id: '', room_id: '', participantIds: [],
        isRecurring: false, recurrenceType: 'weekly', recurrenceEndDate: ''
    });
    
    const [allMembers, setAllMembers] = useState([]);
    const [availableTrainers, setAvailableTrainers] = useState([]);
    const [availableRooms, setAvailableRooms] = useState([]);

    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [fetchError, setFetchError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    
    // סטייט למודל בחירת הסדרה
    const [recurrenceAction, setRecurrenceAction] = useState({
        isOpen: false,
        type: 'save', // 'save' or 'delete'
    });

    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {}
    });

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        const loadModalData = async () => {
            setIsLoading(true);
            setFetchError('');
            try {
                let baseData = {};
                if (isEditMode && meeting?.id) {
                    const meetingDetails = await api.get(`/api/meetings/${meeting.id}`);
                    const participantIds = meetingDetails.participants ? meetingDetails.participants.map(p => p.id) : [];
                    if (meetingDetails.date) {
                        meetingDetails.date = meetingDetails.date.split('T')[0];
                    }
                    // שומרים את ה-group_id מהשרת, אבל isRecurring יהיה false כדי לא להציג את הצ'קבוקס בעריכה
                    baseData = { ...meetingDetails, participantIds, isRecurring: false };
                } else if (initialData) {
                    const startTime = new Date(`${initialData.date}T${initialData.start_time}`);
                    
                    // חישוב תאריך סיום סדרה דיפולטיבי (3 חודשים קדימה)
                    const defaultEndDate = new Date(initialData.date);
                    defaultEndDate.setMonth(defaultEndDate.getMonth() + 3);

                    if (!isNaN(startTime)) {
                        startTime.setHours(startTime.getHours() + 1);
                        const endTime = startTime.toTimeString().slice(0, 5);
                        baseData = { 
                            ...initialData, 
                            end_time: endTime,
                            recurrenceEndDate: defaultEndDate.toISOString().split('T')[0]
                        };
                    } else {
                        baseData = {
                            ...initialData,
                            recurrenceEndDate: defaultEndDate.toISOString().split('T')[0]
                        };
                    }
                }
                setFormData(prev => ({ ...prev, ...baseData }));

                const { date, start_time, end_time } = baseData;
                if (date && start_time && end_time) {
                    let roomsUrl = `/api/rooms/available?date=${date}&start_time=${start_time}&end_time=${end_time}`;
                    let trainersUrl = `/api/users/available-trainers?date=${date}&start_time=${start_time}&end_time=${end_time}`;
                    if (isEditMode && meeting?.id) {
                        roomsUrl += `&meetingId=${meeting.id}`;
                        trainersUrl += `&meetingId=${meeting.id}`;
                    }
                    
                    const [membersRes, roomsRes, trainersRes] = await Promise.all([
                        api.get('/api/users/all?role=member'),
                        api.get(roomsUrl),
                        api.get(trainersUrl)
                    ]);

                    setAllMembers(membersRes || []);
                    setAvailableRooms(roomsRes || []);
                    setAvailableTrainers(trainersRes || []);
                } else {
                    const membersRes = await api.get('/api/users/all?role=member');
                    setAllMembers(membersRes || []);
                }

            } catch (err) {
                setFetchError(err.message || "שגיאה בטעינת נתוני הטופס. אנא סגור ונסה שוב.");
            } finally {
                setIsLoading(false);
            }
        };

        loadModalData();
    }, [meeting, isEditMode, initialData]);

    const resetErrors = () => {
        setError('');
        setFieldErrors({});
        setConfirmState({ isOpen: false });
    };

    const handleChange = (e) => {
        resetErrors();
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;
        const newFormData = { ...formData, [name]: newValue };

        if (name === 'start_time' && newFormData.date) {
            const startTime = new Date(`${newFormData.date}T${value}`);
            if (!isNaN(startTime)) {
                startTime.setHours(startTime.getHours() + 1);
                newFormData.end_time = startTime.toTimeString().slice(0, 5);
            }
        }
        setFormData(newFormData);
    };

    // --- לוגיקת שמירה ---
    const handleSaveRequest = (e) => {
        e.preventDefault();
        resetErrors();

        const now = new Date();
        const meetingStartDateTime = new Date(`${formData.date}T${formData.start_time}`);
        now.setSeconds(0, 0);

        if (!isEditMode && meetingStartDateTime < now) {
            return setError('לא ניתן לקבוע שיעור בזמן עבר.');
        }

        const meetingDayJs = new Date(formData.date).getDay();
        const meetingDayDB = meetingDayJs; 
        const hoursForDay = operatingHours.find(h => h.day_of_week === meetingDayDB);

        if (!hoursForDay || (hoursForDay.open_time === hoursForDay.close_time)) {
            return setError(`הסטודיו סגור ביום שנבחר.`);
        }

        if (formData.start_time < hoursForDay.open_time || formData.end_time > hoursForDay.close_time) {
            return setError(`שעות הפעילות ביום זה הן בין ${hoursForDay.open_time.slice(0, 5)} ל-${hoursForDay.close_time.slice(0, 5)}.`);
        }

        // אם זו עריכה של סדרה, פותחים את המודל בחירה
        if (isEditMode && isSeries) {
            setRecurrenceAction({ isOpen: true, type: 'save' });
        } else {
            performSave('single');
        }
    };

    const performSave = async (recurrenceMode) => {
        setRecurrenceAction({ ...recurrenceAction, isOpen: false });
        setIsLoading(true);
        try {
            const payload = { ...formData, recurrenceMode };
            if (isEditMode) {
                await api.put(`/api/meetings/${meeting.id}`, payload);
            } else {
                await api.post('/api/meetings', payload);
            }
            onSave();
        } catch (err) {
            const serverResponse = err.response?.data;
            if (serverResponse && serverResponse.field) {
                setFieldErrors({ [serverResponse.field]: serverResponse.message });
            } else {
                setError(err.message || 'שגיאה בשמירת המפגש.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // --- לוגיקת מחיקה ---
    const handleDeleteRequest = () => {
        setError('');
        if (isSeries) {
            setRecurrenceAction({ isOpen: true, type: 'delete' });
        } else {
            setConfirmState({
                isOpen: true,
                title: 'אישור מחיקת שיעור',
                message: `האם אתה בטוח שברצונך למחוק את השיעור "${formData.name}"? כל המשתתפים הרשומים יוסרו.`,
                onConfirm: () => performDelete('single'),
                confirmText: 'כן, מחק',
                confirmButtonType: 'btn-danger'
            });
        }
    };

    const performDelete = async (recurrenceMode) => {
        setRecurrenceAction({ ...recurrenceAction, isOpen: false });
        setConfirmState({ isOpen: false });
        setIsLoading(true); 
        setError('');
        try {
            await api.delete(`/api/meetings/${meeting.id}?mode=${recurrenceMode}`);
            onSave();
        } catch (err) {
            setError(err.message || 'שגיאה במחיקת השיעור');
        } finally {
            setIsLoading(false);
        }
    };
    
    if (isLoading) {
        return (
             <div className="modal-overlay">
                 <div className="modal-content"><div className="loading">טוען...</div></div>
            </div>
        );
    }

    if (fetchError) {
         return (
             <div className="modal-overlay" onClick={onClose}>
                 <div className="modal-content">
                     <button className="modal-close-btn" onClick={onClose}>&times;</button>
                     <h2>שגיאת טעינה</h2>
                     <p className="error">{fetchError}</p>
                 </div>
            </div>
        );
    }

    return (
        <>
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <button className="modal-close-btn" onClick={onClose}>&times;</button>
                    <h2>{isEditMode ? 'עריכת שיעור' : 'שיעור חדש'}</h2>
                    <form onSubmit={handleSaveRequest} className="settings-form">
                        <div className="form-field">
                            <label>שם שיעור</label>
                            <input name="name" value={formData.name || ''} onChange={handleChange} required />
                        </div>
                        <div className="form-field">
                            <label>תאריך</label>
                            <input type="date" name="date" value={formData.date || ''} onChange={handleChange} min={isEditMode ? undefined : today} required />
                        </div>
                        <div className="form-field">
                            <label>שעת התחלה</label>
                            <input type="time" name="start_time" value={formData.start_time || ''} onChange={handleChange} required />
                        </div>
                        <div className="form-field">
                            <label>שעת סיום</label>
                            <input type="time" name="end_time" value={formData.end_time || ''} onChange={handleChange} required />
                        </div>
                        
                        <div className="form-field">
                            <label>מאמן</label>
                            <select name="trainer_id" value={formData.trainer_id || ''} onChange={handleChange} required>
                                <option value="">בחר מאמן</option>
                                {isEditMode && formData.trainer && !availableTrainers.some(t => t.id === formData.trainer_id) &&
                                    <option key={formData.trainer_id} value={formData.trainer_id}>{formData.trainer.full_name} (לא זמין)</option>
                                }
                                {availableTrainers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                            </select>
                            {fieldErrors.trainer_id && <p className="error field-error">{fieldErrors.trainer_id}</p>}
                        </div>

                        <div className="form-field">
                            <label>חדר</label>
                            <select name="room_id" value={formData.room_id || ''} onChange={handleChange} required>
                                <option value="">בחר חדר</option>
                                {isEditMode && formData.room && !availableRooms.some(r => r.id === formData.room_id) &&
                                    <option key={formData.room_id} value={formData.room_id}>{formData.room.name} (לא זמין)</option>
                                }
                                {availableRooms.map(r => (
                                    <option key={r.id} value={r.id}>
                                        {`${r.name} (קיבולת: ${r.capacity}) ${r.has_equipment ? '🏋️‍♂️' : ''}`}
                                    </option>
                                ))}
                            </select>
                            {fieldErrors.room_id && <p className="error field-error">{fieldErrors.room_id}</p>}
                        </div>

                        <div className="form-field">
                            <label>משתתפים ({formData.participantIds?.length || 0})</label>
                            <MultiSelect
                                options={allMembers.map(m => ({ value: m.id, label: m.full_name }))}
                                selected={formData.participantIds || []}
                                onChange={(selectedIds) => {
                                    resetErrors();
                                    setFormData(prev => ({ ...prev, participantIds: selectedIds }));
                                }}
                                placeholder="בחר משתתפים..."
                            />
                            {fieldErrors.participantIds && <p className="error field-error">{fieldErrors.participantIds}</p>}
                        </div>

                        {/* אזור השיעורים החוזרים - מוצג רק ביצירה חדשה */}
                        {!isEditMode && (
                            <div className="recurrence-section">
                                <div style={{ marginBottom: '10px' }}>
                                    <label className="recurrence-checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="isRecurring"
                                            checked={formData.isRecurring}
                                            onChange={handleChange}
                                        />
                                        קבע כשיעור קבוע (סדרה)
                                    </label>
                                </div>

                                {formData.isRecurring && (
                                    <div className="recurrence-options">
                                        <div className="form-field">
                                            <label>תדירות</label>
                                            <select
                                                name="recurrenceType"
                                                value={formData.recurrenceType}
                                                onChange={handleChange}
                                            >
                                                <option value="weekly">כל שבוע (באותו יום)</option>
                                                <option value="biweekly">כל שבועיים</option>
                                                <option value="monthly">פעם בחודש (באותו תאריך)</option>
                                            </select>
                                        </div>
                                        <div className="form-field">
                                            <label>עד תאריך</label>
                                            <input
                                                type="date"
                                                name="recurrenceEndDate"
                                                value={formData.recurrenceEndDate}
                                                onChange={handleChange}
                                                min={formData.date}
                                                required={formData.isRecurring}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {error && <p className="error">{error}</p>}

                        <div className="modal-actions">
                            {isEditMode && <button type="button" className="btn btn-danger" onClick={handleDeleteRequest} disabled={isLoading}>מחק</button>}
                            
                            <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? 'שומר...' : 'שמור שינויים'}</button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Recurrence Action Modal - Now using Portal */}
            <RecurrenceActionModal 
                isOpen={recurrenceAction.isOpen}
                onClose={() => setRecurrenceAction({ ...recurrenceAction, isOpen: false })}
                onSelect={(mode) => recurrenceAction.type === 'save' ? performSave(mode) : performDelete(mode)}
                actionType={recurrenceAction.type}
            />

            <ConfirmModal
                isOpen={confirmState.isOpen}
                title={confirmState.title}
                message={confirmState.message}
                onConfirm={confirmState.onConfirm}
                onCancel={() => setConfirmState({ isOpen: false })}
                confirmText={confirmState.confirmText || 'אישור'}
                cancelText="ביטול"
                confirmButtonType={confirmState.confirmButtonType || 'btn-danger'}
            />
        </>
    );
}

export default MeetingModal;