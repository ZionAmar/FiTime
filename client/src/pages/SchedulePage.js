import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import heLocale from '@fullcalendar/core/locales/he';
import api from '../services/api'; 
import BookingModal from '../components/BookingModal';
import TrainerViewModal from '../components/TrainerViewModal'; 
import '../styles/FullCalendar.css';

function SchedulePage() {
    const [events, setEvents] = useState([]);
    const [selectedEventForBooking, setSelectedEventForBooking] = useState(null);
    const [selectedMeetingIdForTrainer, setSelectedMeetingIdForTrainer] = useState(null);
    const [fetchError, setFetchError] = useState(null);
    const { user, activeStudio, activeRole } = useAuth(); 

    const fetchEvents = useCallback(async () => {
        if (!activeStudio) return;
        setFetchError(null);
        try {
            let meetingsToDisplay = [];
        
            if (activeRole === 'trainer') {
                meetingsToDisplay = await api.get(`/api/meetings?viewAs=trainer`);
            } else {
                
                const publicMeetings = await api.get(`/api/meetings/public?studioId=${activeStudio.studio_id}`);
                const meetingsMap = new Map(publicMeetings.map(m => [m.id, m]));
            
                if (user) { 
                    const myMeetings = await api.get(`/api/meetings?viewAs=${activeRole}`);
                    myMeetings.forEach(myMeeting => {
                        meetingsMap.set(myMeeting.id, myMeeting);
                    });
                }
                meetingsToDisplay = Array.from(meetingsMap.values());
            }
        
            if (Array.isArray(meetingsToDisplay)) {
                const formattedEvents = meetingsToDisplay.map(item => {
                    const userStatus = item.status;
                    const isRegistered = Boolean(userStatus);
                    let eventTitle = item.name;
                    
                    if (activeRole !== 'trainer' && item.trainerName) {
                        eventTitle += ` (${item.trainerName})`;
                    }
                
                    if (userStatus === 'waiting') eventTitle += ' (בהמתנה)';
                    else if (userStatus === 'pending') eventTitle += ' (ממתין לאישור)';
                
                    return {
                        ...item,
                        title: eventTitle,
                        backgroundColor: isRegistered ? 'var(--secondary-color)' : 'var(--primary-color)',
                        borderColor: isRegistered ? 'var(--secondary-color)' : 'var(--primary-color)',
                        extendedProps: { 
                            isMyEvent: userStatus === 'active' || userStatus === 'checked_in',
                            trainerName: item.trainerName, 
                            roomName: item.roomName,
                            status: userStatus,
                            registrationId: item.registrationId
                        }
                    };
                });
                setEvents(formattedEvents);
            }
        } catch (error) {
            const errorMessage = error.message || "שגיאה כללית בטעינת לוח השיעורים. נסה שוב.";
            setFetchError(errorMessage);
            setEvents([]); 
        }
    }, [user, activeStudio, activeRole]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);
    
    const handleEventClick = (clickInfo) => {
        if (fetchError) return;
        
        if (activeRole === 'trainer') {
            setSelectedMeetingIdForTrainer(clickInfo.event.id);
        } else {
            setSelectedEventForBooking({
                id: clickInfo.event.id,
                title: clickInfo.event.title,
                start: new Date(clickInfo.event.startStr),
                isMyEvent: clickInfo.event.extendedProps.isMyEvent,
                trainerName: clickInfo.event.extendedProps.trainerName,
                roomName: clickInfo.event.extendedProps.roomName,
                status: clickInfo.event.extendedProps.status,
                registrationId: clickInfo.event.extendedProps.registrationId 
            });
        }
    };

    const handleModalSave = () => {
        setSelectedEventForBooking(null);
        setSelectedMeetingIdForTrainer(null);
        fetchEvents();
    };
    
    const handleCloseModal = () => {
        setSelectedEventForBooking(null);
        setSelectedMeetingIdForTrainer(null);
    };

    if (fetchError) {
        return (
            <div className="error-state-full-page" style={{ padding: '20px', textAlign: 'center' }}>
                <h2 style={{ color: '#dc3545' }}>❌ שגיאה בטעינת הלוח</h2>
                <p style={{ marginTop: '15px', fontWeight: 'bold' }}>{fetchError}</p>
                <button 
                    style={{ marginTop: '20px' }} 
                    className="btn btn-secondary" 
                    onClick={() => window.location.reload()}>
                        טען מחדש
                </button>
            </div>
        );
    }
    
    return (
        <div className="container">
            {/* <div className="schedule-header">
                <h2>לוח שיעורים</h2>
                <p>
                    {activeRole === 'member' 
                        ? 'לחץ על שיעור כדי להירשם או לבטל הרשמה.' 
                        : activeRole === 'trainer' 
                        ? 'לחץ על שיעור כדי לסמן נוכחות מתאמנים.' 
                        : 'התחבר כדי לנהל את השיעורים האישיים שלך.'}
                </p>
            </div> */}
            
            <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                locale={heLocale}
                events={events}
                timeZone='local'
                eventClick={handleEventClick}
                dayMaxEvents={true}
            />

            {selectedEventForBooking && (
                <BookingModal 
                    event={selectedEventForBooking} 
                    onClose={handleCloseModal} 
                    onSave={handleModalSave}
                />
            )}

            {selectedMeetingIdForTrainer && (
                <TrainerViewModal
                    meetingId={selectedMeetingIdForTrainer}
                    onClose={handleCloseModal}
                    onSave={handleModalSave}
                />
            )}
        </div>
    );
}

export default SchedulePage;