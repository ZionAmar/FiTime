import React, { useState, useEffect } from 'react';
import api from '../services/api';
import '../styles/UserModal.css'; 

function TrainerViewModal({ meetingId, onClose }) {
    const [meetingDetails, setMeetingDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchMeetingDetails = async () => {
            if (!meetingId) return;
            setIsLoading(true);
            setError('');
            try {
                const details = await api.get(`/api/meetings/${meetingId}`);
                setMeetingDetails(details);
            } catch (err) {
                setError(err.message || 'שגיאה בטעינת פרטי המפגש.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchMeetingDetails();
    }, [meetingId]);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>&times;</button>
                {isLoading && <div className="loading">טוען פרטים...</div>}
                {error && <p className="error" style={{textAlign: 'center', padding: '20px'}}>{error}</p>}
                {meetingDetails && (
                    <>
                        <h2>פרטי מפגש: {meetingDetails.name}</h2>
                        <p><strong>תאריך:</strong> {new Date(meetingDetails.date).toLocaleDateString('he-IL')}</p>
                        <p><strong>שעה:</strong> {meetingDetails.start_time.slice(0, 5)} - {meetingDetails.end_time.slice(0, 5)}</p>
                        <p><strong>חדר:</strong> {meetingDetails.roomName || 'לא שויך חדר'}</p>
                        
                        <hr style={{margin: '1.5rem 0', borderTop: '1px solid var(--border-color)'}} />

                        <h4>רשימת משתתפים ({meetingDetails.participants?.length || 0})</h4>
                        {meetingDetails.participants && meetingDetails.participants.length > 0 ? (
                            <ul className="participants-list" style={{padding: 0, listStyle: 'none'}}>
                                {meetingDetails.participants.map(p => (
                                    <li key={p.id} style={{padding: '5px 0', borderBottom: '1px solid var(--border-color)'}}>
                                        {p.full_name} ({p.status})
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p style={{opacity: 0.7}}>אין משתתפים רשומים כרגע.</p>
                        )}
                        
                        {meetingDetails.waitingList && meetingDetails.waitingList.length > 0 && (
                             <>
                                <h4 style={{marginTop: '1.5rem'}}>רשימת המתנה ({meetingDetails.waitingList.length})</h4>
                                <ul className="participants-list" style={{padding: 0, listStyle: 'none'}}>
                                    {meetingDetails.waitingList.map(p => (
                                        <li key={p.id} style={{padding: '5px 0', borderBottom: '1px solid var(--border-color)'}}>{p.full_name}</li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default TrainerViewModal;