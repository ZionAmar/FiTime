import React, { useState, useEffect, useRef, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import heLocale from '@fullcalendar/core/locales/he';
import api from '../services/api';
import MeetingModal from '../components/MeetingModal';
import SearchableSelect from '../components/SearchableSelect';
import '../styles/FullCalendar.css';
import '../styles/ManageSchedulePage.css'; 
import { HebrewCalendar, Location } from '@hebcal/core';

function ManageSchedulePage() {
    const calendarRef = useRef(null);

    const [events, setEvents] = useState([]);
    const [trainers, setTrainers] = useState([]);
    const [selectedTrainer, setSelectedTrainer] = useState('all');
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [modalInitialData, setModalInitialData] = useState(null);
    const [operatingHours, setOperatingHours] = useState([]);
    const [businessHours, setBusinessHours] = useState([]);
    const [viewMinTime, setViewMinTime] = useState('00:00:00');
    const [viewMaxTime, setViewMaxTime] = useState('24:00:00');
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null); 
    
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const holidaysEvents = useMemo(() => {
        const year = new Date().getFullYear();
        const options = {
            year: year,
            isHebrewYear: false,
            candlelighting: false,
            location: Location.lookup('Jerusalem'),
            sedrot: false,
            omer: false,
        };

        const calEvents = HebrewCalendar.calendar(options);
        const results = [];

        calEvents.forEach(ev => {
            if (ev.getFlags() & (1 | 2)) {
                 results.push({
                    title: ev.render('he'),
                    start: ev.getDate().greg(),
                    allDay: true,
                    display: 'background',
                    backgroundColor: '#ffebee',
                    classNames: ['holiday-event'],
                    extendedProps: { isHoliday: true }
                });
            }
        });

        let d = new Date(year, 0, 1);
        while (d.getFullYear() === year) {
            if (d.getDay() === 6) { 
                results.push({
                    title: 'שבת',
                    start: new Date(d),
                    allDay: true,
                    display: 'background',
                    backgroundColor: '#f5f5f5',
                    classNames: ['shabbat-event'],
                    extendedProps: { isHoliday: true }
                });
            }
            d.setDate(d.getDate() + 1);
        }
        return results;
    }, []);

    const fetchEvents = async () => {
        try {
            const meetingsRes = await api.get('/api/meetings');
            if (Array.isArray(meetingsRes)) {
                // תיקון: מיפוי הנתונים לתוך extendedProps כדי ש-group_id יעבור למודל
                setEvents(meetingsRes.map(m => ({
                    ...m,
                    title: m.name,
                    extendedProps: {
                        ...m, // מעביר את כל השדות כולל group_id, trainer_id וכו'
                        group_id: m.group_id 
                    }
                })));
            }
        } catch (error) {
            setFetchError(error.message || "שגיאה בטעינת השיעורים.");
            throw error; 
        }
    };

    useEffect(() => {
        const loadInitialData = async () => {
            setFetchError(null);
            setIsLoading(true);
            try {
                await fetchEvents(); 

                const [trainersRes, settingsRes] = await Promise.all([
                    api.get('/api/users/all?role=trainer'),
                    api.get('/api/studio/settings')
                ]);

                if (Array.isArray(trainersRes)) {
                    setTrainers(trainersRes);
                }
                
                if (settingsRes && Array.isArray(settingsRes.hours)) {
                    const activeHours = settingsRes.hours.filter(h => h.open_time !== h.close_time);
                    setOperatingHours(activeHours); 

                    const calendarHours = activeHours.map(h => ({
                        daysOfWeek: [ h.day_of_week ], 
                        startTime: h.open_time,
                        endTime: h.close_time
                    }));
                    setBusinessHours(calendarHours);

                    if (activeHours.length > 0) {
                        const earliest = activeHours.reduce((min, h) => h.open_time < min ? h.open_time : min, '24:00:00');
                        const latest = activeHours.reduce((max, h) => h.close_time > max ? h.close_time : max, '00:00:00');
                        setViewMinTime(earliest);
                        setViewMaxTime(latest);
                    }
                }
            } catch (error) {
                setFetchError(error.message || "שגיאה בטעינת נתונים ראשוניים. אנא ודא הרשאות.");
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, []);
    
    const handleDateClick = (arg) => {
        if (fetchError) return;
        if (!calendarRef.current) return;

        const clickedDateString = arg.dateStr.split('T')[0];
        const isHoliday = holidaysEvents.some(h => {
             const holidayDate = h.start.toISOString().split('T')[0];
             return holidayDate === clickedDateString;
        });

        if (isHoliday) {
            alert("לא ניתן לקבוע שיעורים בשבתות וחגים.");
            return; 
        }

        const calendarApi = calendarRef.current.getApi();
        const currentView = calendarApi.view.type;

        if (currentView === 'dayGridMonth') {
            calendarApi.changeView('timeGridDay', arg.dateStr);
            return;
        }
        
        const clickedDate = arg.date;
        const clickedDay = clickedDate.getDay(); 
        
        const hoursForDay = businessHours.find(bh => bh.daysOfWeek.includes(clickedDay));

        if (!hoursForDay) {
            alert('הסטודיו סגור ביום זה (מחוץ לשעות הפעילות).');
            return;
        }

        const clickedTime = clickedDate.toTimeString().slice(0, 8);
        if (clickedTime < hoursForDay.startTime || clickedTime >= hoursForDay.endTime) {
            return; 
        }

        const [hour, minute] = clickedDate.toTimeString().split(':');
        setModalInitialData({
            date: arg.dateStr.split('T')[0],
            start_time: `${hour}:${minute}`
        });
    };
    
    const handleDatesSet = (dateInfo) => {
        if (!calendarRef.current) return;
        const calendarApi = calendarRef.current.getApi();
        if (dateInfo.view.type === 'timeGridDay') {
            const currentDay = dateInfo.view.currentStart.getDay();
            const dayHours = businessHours.find(bh => bh.daysOfWeek.includes(currentDay));
            
            if (dayHours) {
                calendarApi.setOption('slotMinTime', dayHours.startTime);
                calendarApi.setOption('slotMaxTime', dayHours.endTime);
            } else {
                calendarApi.setOption('slotMinTime', '08:00:00');
                calendarApi.setOption('slotMaxTime', '20:00:00');
            }
        } else {
            calendarApi.setOption('slotMinTime', viewMinTime);
            calendarApi.setOption('slotMaxTime', viewMaxTime);
        }
    };

    const handleEventClick = (clickInfo) => {
        if (fetchError) return;
        if (clickInfo.event.display === 'background') return;

        // תיקון: שליפת הנתונים מתוך extendedProps והעברתם למודל
        const eventProps = clickInfo.event.extendedProps || {};
        
        setSelectedMeeting({
            id: parseInt(clickInfo.event.id),
            title: clickInfo.event.title,
            start: clickInfo.event.start,
            end: clickInfo.event.end,
            // כאן הקסם: מעבירים את ה-group_id למודל
            group_id: eventProps.group_id,
            trainer_id: eventProps.trainer_id,
            room_id: eventProps.room_id,
            ...eventProps
        });
    };
    
    const handleModalClose = () => {
        setSelectedMeeting(null);
        setModalInitialData(null);
    };

    const handleModalSave = () => {
        handleModalClose();
        fetchEvents();
    };

    const filteredEvents = events.filter(event => 
        selectedTrainer === 'all' || String(event.trainer_id) === String(selectedTrainer)
    );

    const eventsToDisplay = [...filteredEvents, ...holidaysEvents];

    const trainerOptions = [
        { value: 'all', label: 'כל המאמנים' },
        ...trainers.map(t => ({ value: t.id, label: t.full_name }))
    ];

    if (isLoading) return <div className="loading">טוען את לוח השנה לניהול...</div>;
    
    if (fetchError) {
        return (
            <div className="error-state-full-page">
                <h2>❌ שגיאה בטעינת הלוח</h2>
                <p>{fetchError}</p>
                <button 
                    className="btn btn-secondary" 
                    onClick={() => window.location.reload()}>
                    טען מחדש
                </button>
            </div>
        );
    }

    return (
        <div className="container"> 
            <div className="schedule-header">
                <div className="schedule-filters">
                    <SearchableSelect 
                        options={trainerOptions}
                        value={selectedTrainer}
                        onChange={(val) => setSelectedTrainer(val)}
                        placeholder="סינון לפי מאמן..."
                    />
                </div>
            </div>
            
            <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                height="80vh"
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                initialView={'dayGridMonth'}
                locale={heLocale}
                events={eventsToDisplay}
                eventClick={handleEventClick}
                dateClick={handleDateClick}
                datesSet={handleDatesSet}
                editable={true}
                dayMaxEvents={true} 
                businessHours={businessHours}
                selectConstraint="businessHours"
                
                views={{
                    timeGridWeek: {
                        type: 'timeGrid',
                        duration: { days: isMobile ? 7 : 7 },
                        buttonText: isMobile ? 'שבוע' : 'שבוע'
                    }
                }}
            />

            {(selectedMeeting || modalInitialData) && (
                <MeetingModal
                    meeting={selectedMeeting}
                    initialData={modalInitialData}
                    operatingHours={operatingHours}
                    trainers={trainers}
                    onClose={handleModalClose}
                    onSave={handleModalSave}
                />
            )}
        </div>
    );
}

export default ManageSchedulePage;