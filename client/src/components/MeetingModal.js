import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import MultiSelect from './MultiSelect';
import ConfirmModal from './ConfirmModal';
import '../styles/UserModal.css';

function MeetingModal({ meeting, onSave, onClose, initialData, operatingHours }) {
    const isEditMode = Boolean(meeting);
    const [formData, setFormData] = useState({
        name: '', date: '', start_time: '', end_time: '',
        trainer_id: '', room_id: '', participantIds: []
    });
    
    const [allMembers, setAllMembers] = useState([]);
    const [availableTrainers, setAvailableTrainers] = useState([]);
    const [availableRooms, setAvailableRooms] = useState([]);

    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [fetchError, setFetchError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    
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
                    baseData = { ...meetingDetails, participantIds };
                } else if (initialData) {
                    const startTime = new Date(`${initialData.date}T${initialData.start_time}`);
                    if (!isNaN(startTime)) {
                        startTime.setHours(startTime.getHours() + 1);
                        const endTime = startTime.toTimeString().slice(0, 5);
                        baseData = { ...initialData, end_time: endTime };
                    } else {
                        baseData = initialData;
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
        closeConfirmModal();
    };

    const closeConfirmModal = () => {
        setConfirmState({ isOpen: false });
    };

    const handleChange = (e) => {
        resetErrors();
        const { name, value } = e.target;
        const newFormData = { ...formData, [name]: value };

        if (name === 'start_time' && newFormData.date) {
            const startTime = new Date(`${newFormData.date}T${value}`);
            if (!isNaN(startTime)) {
                startTime.setHours(startTime.getHours() + 1);
                newFormData.end_time = startTime.toTimeString().slice(0, 5);
            }
        }
        setFormData(newFormData);
    };

    const handleSave = async (e) => {
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

        setIsLoading(true);
        try {
            if (isEditMode) {
                await api.put(`/api/meetings/${meeting.id}`, formData);
            } else {
                await api.post('/api/meetings', formData);
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

    const handleDelete = () => {
        setError(''); 
        setConfirmState({
            isOpen: true,
            title: 'אישור מחיקת שיעור',
            message: `האם אתה בטוח שברצונך למחוק את השיעור "${formData.name}"? כל המשתתפים הרשומים יוסרו.`,
            onConfirm: performDelete,
            confirmText: 'כן, מחק',
            confirmButtonType: 'btn-danger'
        });
    };

    const performDelete = async () => {
        closeConfirmModal();
        setIsLoading(true); 
        setError('');
        try {
            await api.delete(`/api/meetings/${meeting.id}`);
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
                    <form onSubmit={handleSave} className="settings-form">
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

                        {error && <p className="error">{error}</p>}

                        <div className="modal-actions">
                            {isEditMode && <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={isLoading}>מחק</button>}
                            
                            <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? 'שומר...' : 'שמור שינויים'}</button>
                        </div>
                    </form>
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

export default MeetingModal;