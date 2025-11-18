import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import heLocale from '@fullcalendar/core/locales/he';
import api from '../services/api';
import MeetingModal from '../components/MeetingModal';
import SearchableSelect from '../components/SearchableSelect'; // 1. ייבוא הרכיב החדש
import '../styles/FullCalendar.css';
import '../styles/ManageSchedulePage.css'; 

function ManageSchedulePage() {
    const location = useLocation();
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

    const fetchEvents = async () => {
        try {
            const meetingsRes = await api.get('/api/meetings');
            if (Array.isArray(meetingsRes)) {
                setEvents(meetingsRes.map(m => ({ ...m, title: m.name })));
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
            alert('הסטודיו סגור ביום זה.');
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
        setSelectedMeeting({ id: clickInfo.event.id });
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
        selectedTrainer === 'all' || event.trainer_id == selectedTrainer
    );

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
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                initialView={'dayGridMonth'}
                locale={heLocale}
                events={filteredEvents}
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