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

// 1. ייבוא הספרייה לחישוב תאריכים עבריים
import { HebrewCalendar, Location } from '@hebcal/core';

function SchedulePage() {
    const [events, setEvents] = useState([]);
    const [selectedEventForBooking, setSelectedEventForBooking] = useState(null);
    const [selectedMeetingIdForTrainer, setSelectedMeetingIdForTrainer] = useState(null);
    const [fetchError, setFetchError] = useState(null);
    const { user, activeStudio, activeRole } = useAuth(); 

    // פונקציית עזר לחישוב חגים ושבתות
    const getJewishHolidaysAndShabbat = () => {
        const year = new Date().getFullYear();
        const options = {
            year: year,
            isHebrewYear: false,
            candlelighting: false,
            location: Location.lookup('Jerusalem'), // או טבריה אם יש תמיכה, ירושלים זה ברירת מחדל טובה לזמנים כלליים
            sedrot: false,
            omer: false,
        };

        const events = HebrewCalendar.calendar(options);
        const holidayEvents = [];

        // הוספת חגים מהלוח העברי
        events.forEach(ev => {
            // מסננים רק חגים משמעותיים (שבתון)
            if (ev.getFlags() & (1 | 2)) { // 1=Yom Tov, 2=Shabbat (בערך, תלוי במימוש)
                 holidayEvents.push({
                    title: ev.render('he'),
                    start: ev.getDate().greg(),
                    allDay: true,
                    display: 'background', // זה הופך את האירוע לרקע ולא לאירוע לחיץ
                    backgroundColor: '#ffebee', // צבע אדמדם בהיר לחגים
                    classNames: ['holiday-event'] // אפשר להוסיף CSS מותאם אישית
                });
            }
        });

        // הוספת שבתות באופן ידני (אם hebcal לא מחזיר את כל השבתות בצורה שרצינו)
        // או פשוט להסתמך על זה שאנחנו חוסמים ימי שבת:
        // FullCalendar יודע לטפל בשבתות ויזואלית, אבל אם רוצים כיתוב "שבת":
        let d = new Date(year, 0, 1);
        while (d.getFullYear() === year) {
            if (d.getDay() === 6) { // 6 = Saturday
                holidayEvents.push({
                    title: 'שבת',
                    start: new Date(d),
                    allDay: true,
                    display: 'background',
                    backgroundColor: '#f5f5f5', // אפור בהיר לשבת
                    classNames: ['shabbat-event']
                });
            }
            d.setDate(d.getDate() + 1);
        }
        
        return holidayEvents;
    };

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

                // 2. שילוב החגים והשבתות לתוך המערך הסופי
                const holidays = getJewishHolidaysAndShabbat();
                setEvents([...formattedEvents, ...holidays]);
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
    
    // לוגיקה למניעת לחיצה על שבת/חג (אם בטעות נוצר שם אירוע)
    const handleEventClick = (clickInfo) => {
        if (fetchError) return;

        // אם לחצו על אירוע רקע (חג/שבת) - פשוט נתעלם
        if (clickInfo.event.display === 'background') return;
        
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

    // ... שאר הקוד (Modals וכו') נשאר זהה ...

    return (
        <div className="container">
            <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                locale={heLocale}
                events={events}
                timeZone='local'
                eventClick={handleEventClick}
                dayMaxEvents={true}
                // אפשר להוסיף גם businessHours כדי להחשיך ויזואלית את שבת
                businessHours={{
                    daysOfWeek: [0, 1, 2, 3, 4, 5], // ימים א-ו
                    startTime: '06:00',
                    endTime: '22:00',
                }}
            />
            
            {/* ... Modals ... */}
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