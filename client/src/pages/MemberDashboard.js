import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ConfirmModal from '../components/ConfirmModal';
import '../styles/Dashboard.css';

const StatPill = ({ label, value, icon }) => (
    <div className="stat-pill">
        <span className="stat-icon">{icon}</span>
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
    </div>
);

const ListItem = ({ title, subtitle, status, statusType, onCancel, registrationId }) => (
    <div className="list-item">
        <div className="item-details">
            <span className="item-title">{title}</span>
            <span className="item-subtitle">{subtitle}</span>
        </div>
        <div className="item-actions">
            {status && <span className={`status-badge ${statusType}`}>{status}</span>}
            {onCancel && (
                <button 
                    className="btn-cancel-list btn-danger"
                    onClick={() => onCancel(registrationId, title)}
                    title="בטל הרשמה מרשימת ההמתנה"
                >
                    בטל
                </button>
            )}
        </div>
    </div>
);

const SessionDetailsModal = ({ session, isOpen, onClose, onCancel, showCancelButton, cancelError }) => {
    useEffect(() => {
        const handleEsc = (event) => {
            if (event.keyCode === 27) onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!isOpen || !session) return null;
    const formatFullDate = (date) => new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit', hour12: false }).format(date);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close-button" onClick={onClose}>&times;</button>
                <h2>פרטי השיעור</h2>
                <h3>{session.name}</h3>
                {cancelError && <p className="error" style={{ color: '#dc3545', fontWeight: 'bold' }}>שגיאה בביטול: {cancelError}</p>}
                <div className="modal-details-grid">
                    <p><strong>מאמן/ת:</strong> {session.trainerName}</p>
                    <p><strong>תאריך ושעה:</strong> {formatFullDate(session.start)}</p>
                    <p><strong>חדר:</strong> {session.roomName}</p>
                    <p><strong>משתתפים רשומים:</strong> {session.participant_count} / {session.capacity}</p>
                </div>
                {showCancelButton && (
                    <div className="modal-actions">
                        <button className="btn btn-danger" onClick={() => onCancel(session.registrationId, session.name)}>בטל הרשמה</button>
                    </div>
                )}
            </div>
        </div>
    );
};

function MemberDashboard() {
    const { user, activeStudio } = useAuth();
    const navigate = useNavigate();
    
    const [myMeetings, setMyMeetings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);
    const [cancelError, setCancelError] = useState(null);
    const [arrivalError, setArrivalError] = useState(null);
    const [listError, setListError] = useState(null);
    
    const [confirmState, setConfirmState] = useState({ isOpen: false });

    const closeConfirmModal = () => {
        setConfirmState({ isOpen: false });
    };

    const resetListMessages = () => {
        setListError(null);
    };

    const fetchMeetings = async () => {
        setIsLoading(true);
        setError(null);
        resetListMessages();
        try {
            const data = await api.get('/api/meetings?viewAs=member'); 
            if (Array.isArray(data)) {
                const processedMeetings = data.map(m => ({ ...m, start: new Date(m.start), end: new Date(m.end) }));
                setMyMeetings(processedMeetings);
            } else {
                setMyMeetings([]);
            }
        } catch (err) {
            const errorMessage = err.message || "לא הצלחנו לטעון את המידע. נסה לרענן את העמוד.";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user && activeStudio) {
            fetchMeetings();
        } else {
            setIsLoading(false);
        }
    }, [user, activeStudio]);
    
    const performCancel = async (registrationId, origin) => {
        closeConfirmModal();
        setCancelError(null);
        setListError(null);
        setIsLoading(true);

        try {
            await api.delete(`/api/participants/${registrationId}`);
            fetchMeetings();
            if (origin === 'modal') {
                closeSessionDetails();
            }
        } catch (err) {
            const errorMsg = err.message || "שגיאה לא צפויה בביטול ההרשמה.";
            if (origin === 'modal') {
                setCancelError(errorMsg);
            } else {
                setListError(errorMsg);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleModalCancel = (registrationId, sessionName) => {
        setCancelError(null);
        setConfirmState({
            isOpen: true,
            title: 'אישור ביטול הרשמה',
            message: `האם לבטל את הרשמתך לשיעור "${sessionName}"?`,
            onConfirm: () => performCancel(registrationId, 'modal'),
            confirmText: 'כן, בטל',
            confirmButtonType: 'btn-danger'
        });
    };
    
    const handleListCancel = (registrationId, sessionName) => {
        setListError(null);
        setConfirmState({
            isOpen: true,
            title: 'אישור ביטול הרשמה',
            message: `האם לבטל את הרשמתך מרשימת ההמתנה לשיעור "${sessionName}"?`,
            onConfirm: () => performCancel(registrationId, 'list'),
            confirmText: 'כן, בטל',
            confirmButtonType: 'btn-danger'
        });
    };

    const openSessionDetails = (session) => {
        resetListMessages();
        setCancelError(null);
        setSelectedSession(session);
        setIsModalOpen(true);
    };
    
    const closeSessionDetails = () => setIsModalOpen(false);
    
    const generateGoogleCalendarLink = (session) => {
        const formatDateForGoogle = (date) => date.toISOString().replace(/-|:|\.\d{3}/g, '');
        const startTime = formatDateForGoogle(session.start);
        const endTime = formatDateForGoogle(session.end);
        const details = `שיעור ${session.name} עם ${session.trainerName}.`;
        const url = new URL('https://www.google.com/calendar/render');
        url.searchParams.append('action', 'TEMPLATE');
        url.searchParams.append('text', session.name);
        url.searchParams.append('dates', `${startTime}/${endTime}`);
        url.searchParams.append('details', details);
        url.searchParams.append('location', `סטודיו ${activeStudio?.studio_name || 'EasyFit'} - ${session.roomName}`);
        return url.toString();
    };
    
    const handleAddToCalendar = (session) => {
        const link = generateGoogleCalendarLink(session);
        window.open(link, '_blank', 'noopener,noreferrer');
    };
    
    const handleConfirmArrival = async (registrationId) => {
        resetListMessages();
        setArrivalError(null);
        setMyMeetings(currentMeetings => 
            currentMeetings.map(m => 
                m.registrationId === registrationId 
                    ? { ...m, status: 'checked_in' } 
                    : m
            )
        );
        try {
            await api.patch(`/api/participants/${registrationId}/check-in`);
        } catch (error) {
            const errorMessage = error.message || "שגיאה באישור ההגעה. המידע יתעדכן מחדש.";
            setArrivalError(errorMessage);
            fetchMeetings();
        }
    };

    const now = new Date();
    
    const activeAndUpcomingSessions = myMeetings
        .filter(m => m.end > now && ['active', 'checked_in'].includes(m.status))
        .sort((a, b) => a.start - b.start);

    const currentSession = activeAndUpcomingSessions.find(m => m.start <= now && m.end > now);
    const nextSession = !currentSession && activeAndUpcomingSessions.length > 0 ? activeAndUpcomingSessions[0] : null;

    const waitingList = myMeetings.filter(m => m.end > now && (m.status === 'waiting' || m.status === 'pending')).sort((a, b) => a.start - b.start);
    const pastSessions = myMeetings.filter(m => m.end < now && ['active', 'checked_in'].includes(m.status)).sort((a, b) => b.start - b.start);
    const completedThisMonth = pastSessions.filter(m => m.start.getMonth() === now.getMonth() && m.start.getFullYear() === now.getFullYear()).length;
    const totalCompletedSessions = pastSessions.length;

    if (isLoading) return <div className="loading">טוען את מרכז הבקרה שלך...</div>;
    
    if (error) return <div className="error-state"><h2 style={{ color: '#dc3545' }}>❌ שגיאה בטעינת הנתונים:</h2><p>{error}</p></div>;

    const formatFullDate = (date) => new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
    const formatDateOnly = (date) => new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
    const getStatusText = (status) => {
        if (status === 'waiting') return 'ברשימת המתנה';
        if (status === 'pending') return 'ממתין לאišורך';
        return '';
    };

    return (
        <>
            <div className="pro-dashboard">
                <header className="dashboard-header-pro">
                    <div className="header-text">
                        <h1>שלום, {user?.full_name || "מתאמן"}!</h1>
                        <p>מוכנ/ה לכבוש את המטרות שלך היום? הנה תמונת המצב שלך.</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => navigate('/schedule')}>
                        <span>+</span>
                        <span>הזמן שיעור חדש</span>
                    </button>
                </header>

                {arrivalError && <div className="error-state" style={{ margin: '15px 0' }}><p style={{ color: '#dc3545' }}>{arrivalError}</p></div>}
                
                <div className="dashboard-grid-pro">
                    <main className="main-panel-pro">
                        <section className="card-pro next-session-card">
                            {currentSession ? (
                                <div className="live-session">
                                    <div className="card-header">
                                        <div className="live-indicator">Live</div>
                                        <h2>השיעור שלך מתקיים עכשיו</h2>
                                    </div>
                                    <p className="session-title">{currentSession.name}</p>
                                    <p className="session-trainer">עם {currentSession.trainerName}</p>
                                    <p className="session-time">
                                        מסתיים בשעה {new Intl.DateTimeFormat('he-IL', { hour: '2-digit', minute: '2-digit' }).format(currentSession.end)}
                                    </p>
                                    <div className="session-actions">
                                        {currentSession.status === 'checked_in' ? (
                                            <button className="btn btn-success confirm-arrival" disabled>
                                                <span className="checkmark-icon">✓</span> הגעתך אושרה
                                            </button>
                                        ) : (
                                            <button className="btn btn-primary confirm-arrival" onClick={() => handleConfirmArrival(currentSession.registrationId)}>
                                                אישור הגעה
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : nextSession ? (
                                <div>
                                    <div className="card-header">
                                        <span className="card-icon">📅</span>
                                        <h2>השיעור הבא שלך</h2>
                                    </div>
                                    <p className="session-title">{nextSession.name}</p>
                                    <p className="session-trainer">עם {nextSession.trainerName}</p>
                                    <p className="session-time">{formatFullDate(nextSession.start)}</p>
                                    <div className="session-actions">
                                        <button className="btn btn-primary" onClick={() => openSessionDetails(nextSession)}>פרטים</button>
                                        <button className="btn btn-secondary" onClick={() => handleAddToCalendar(nextSession)}>הוסף ליומן</button>
                                        <button className="btn btn-danger" onClick={() => handleModalCancel(nextSession.registrationId, nextSession.name)}>בטל הרשמה</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="placeholder-card">
                                    <h4>אין לך שיעורים קרובים.</h4>
                                    <p>זה הזמן המושלם לקבוע את האימון הבא שלך.</p>
                                </div>
                            )}
                        </section>
                        
                        <section className="card-pro progress-card">
                            <div className="card-header">
                                <span className="card-icon">🚀</span>
                                <h2>ההתקדמות שלך</h2>
                            </div>
                            <div className="stats-pills-container">
                                <StatPill label="אימונים החודש" value={completedThisMonth} icon="💪" />
                                <StatPill label="שיעורים עתידיים" value={activeAndUpcomingSessions.length - (currentSession ? 1 : 0)} icon="🗓️" />
                                <StatPill label="סה״כ אימונים" value={totalCompletedSessions} icon="🏆" />
                            </div>
                        </section>
                    </main>

                    <aside className="side-panel-pro">
                        <section className="card-pro list-card">
                            <div className="card-header">
                                <span className="card-icon">⏳</span>
                                <h2>רשימות המתנה ({waitingList.length})</h2>
                            </div>
                            {listError && <p className="error" style={{padding: '0 15px 10px'}}>{listError}</p>}
                            {waitingList.length > 0 ? (
                                waitingList.map(item => 
                                    <ListItem 
                                        key={item.registrationId}
                                        title={item.name}
                                        subtitle={`עם ${item.trainerName}`}
                                        status={getStatusText(item.status) || formatDateOnly(item.start)}
                                        statusType={item.status}
                                        registrationId={item.registrationId}
                                        onCancel={handleListCancel}
                                    />
                                )
                            ) : <p className="empty-state">אתה לא רשום לאף רשימת המתנה.</p>}
                        </section>

                        <section className="card-pro list-card">
                            <div className="card-header">
                                <span className="card-icon">📚</span>
                                <h2>היסטוריית שיעורים</h2>
                            </div>
                            {pastSessions.slice(0, 3).map(item => 
                                <ListItem 
                                    key={item.registrationId}
                                    title={item.name}
                                    subtitle={formatDateOnly(item.start)}
                                />
                            )}
                            {pastSessions.length === 0 && <p className="empty-state">אין עדיין היסטוריית שיעורים.</p>}
                            <span className="see-all-link" onClick={() => navigate('/history')}>
                                הצג את כל ההיסטוריה →
                            </span>
                        </section>
                    </aside>
                </div>
            </div>
            
            <SessionDetailsModal 
                isOpen={isModalOpen} 
                onClose={closeSessionDetails} 
                session={selectedSession} 
                onCancel={handleModalCancel}
                cancelError={cancelError}
                showCancelButton={selectedSession && !currentSession && nextSession?.id === selectedSession.id}
            />

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

export default MemberDashboard;