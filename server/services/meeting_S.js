const meetingModel = require('../models/meeting_M');
const db = require('../config/db_config'); // נדרש עבור טרנזקציות ישירות במקרה הצורך

const getMeetingsForDashboard = async (user, date, viewAs) => {
    const { id: userId, studioId, roles } = user;
    if (!studioId) {
        const error = new Error("לא נבחר סטודיו פעיל.");
        error.status = 400;
        throw error;
    }

    const effectiveRole = viewAs || (roles.includes('admin') ? 'admin' : roles.includes('trainer') ? 'trainer' : 'member');

    if (effectiveRole === 'admin' || effectiveRole === 'trainer') {
        const meetings = effectiveRole === 'admin' 
            ? await meetingModel.getAllByStudioId(studioId, date) 
            : await meetingModel.getByTrainerId(userId, studioId, date);
            
        return Promise.all(meetings.map(async (meeting) => {
            const participants = await meetingModel.getActiveParticipants(meeting.id);
            const waitingList = await meetingModel.getWaitingParticipants(meeting.id);
            return { ...meeting, participants, waitingList };
        }));
    }

    if (effectiveRole === 'member') {
        const meetingsMap = new Map();
        const myMeetings = await meetingModel.getByMemberId(userId, studioId, date);
        myMeetings.forEach(meeting => meetingsMap.set(meeting.id, meeting));

        const [publicFutureMeetings] = await meetingModel.getPublicSchedule(studioId, date);
        publicFutureMeetings.forEach(meeting => {
            if (!meetingsMap.has(meeting.id)) {
                meetingsMap.set(meeting.id, meeting);
            }
        });
        return Array.from(meetingsMap.values());
    }

    return [];
};

const getPublicSchedule = async (studioId, date) => {
    const [meetings] = await meetingModel.getPublicSchedule(studioId, date);
    return meetings;
};

// --- פונקציית עזר פנימית ליצירת שיעור בודד ---
const createSingleMeeting = async (data, user) => {
    const { participantIds, ...meetingData } = data;
    const meetingInfo = { ...meetingData, studio_id: user.studioId };

    const [overlappingRoom] = await meetingModel.findOverlappingMeeting(meetingInfo);
    if (overlappingRoom.length > 0) {
        const error = new Error(`החדר כבר תפוס בשעה המבוקשת בתאריך ${meetingInfo.date}.`);
        error.status = 409;
        error.field = 'room_id';
        throw error;
    }

    const overlappingTrainer = await meetingModel.findOverlappingMeetingForTrainer(meetingInfo);
    if (overlappingTrainer.length > 0) {
        const error = new Error(`המאמן ${overlappingTrainer[0].trainerName} כבר משובץ למפגש '${overlappingTrainer[0].name}' בזמן זה.`);
        error.status = 409;
        error.field = 'trainer_id';
        throw error;
    }

    const busyParticipants = await meetingModel.findOverlappingMeetingsForParticipants(meetingInfo, participantIds);
    if (busyParticipants.length > 0) {
        const names = busyParticipants.map(p => p.full_name).join(', ');
        const error = new Error(`המתאמנים הבאים כבר רשומים למפגש אחר בתאריך ${meetingInfo.date}: ${names}.`);
        error.status = 409;
        error.field = 'participantIds';
        throw error;
    }

    const result = await meetingModel.create(meetingInfo, participantIds);
    return { id: result.insertId, ...meetingInfo };
};

// --- הפונקציה הראשית ליצירת שיעורים (כולל סדרות) ---
const createMeeting = async (data, user) => {
    const { participantIds, isRecurring, recurrenceType, recurrenceEndDate, ...meetingData } = data;
    
    // אם לא מדובר בסדרה, צור רגיל
    if (!isRecurring) {
        return createSingleMeeting({ ...meetingData, participantIds }, user);
    }

    const createdMeetings = [];
    const groupId = require('crypto').randomUUID(); 
    
    // תיקון שעון חורף/קיץ: מכוונים ל-12 בצהריים
    let currentDate = new Date(meetingData.date);
    currentDate.setHours(12, 0, 0, 0); 

    const endDate = new Date(recurrenceEndDate);
    endDate.setHours(12, 0, 0, 0);
    
    while (currentDate <= endDate) {
        const currentMeetingData = {
            ...meetingData,
            date: currentDate.toISOString().split('T')[0], 
            group_id: groupId,
            participantIds 
        };

        try {
            const result = await createSingleMeeting(currentMeetingData, user);
            createdMeetings.push(result);
        } catch (error) {
            console.log(`Skipped meeting on ${currentMeetingData.date} due to conflict: ${error.message}`);
        }

        if (recurrenceType === 'weekly') {
            currentDate.setDate(currentDate.getDate() + 7);
        } else if (recurrenceType === 'biweekly') {
            currentDate.setDate(currentDate.getDate() + 14);
        } else if (recurrenceType === 'monthly') {
            currentDate.setMonth(currentDate.getMonth() + 1);
        } else {
            break; 
        }
    }

    return { message: `${createdMeetings.length} meetings created in series`, groupId };
};

const markTrainerArrival = async (meetingId, user) => {
    const [[meeting]] = await meetingModel.getById(meetingId);
    if (!meeting) {
        const error = new Error('המפגש לא נמצא.');
        error.status = 404;
        throw error;
    }

    if (user.studioId !== meeting.studio_id) {
        const error = new Error('גישה אסורה: המפגש אינו שייך לסטודיו הנוכחי.');
        error.status = 403;
        throw error;
    }
    if (meeting.trainer_id !== user.id && !user.roles.includes('admin')) {
        const error = new Error('אינך מורשה לסמן הגעה למפגש זה. רק המאמן המשובץ או מנהל יכולים לבצע פעולה זו.');
        error.status = 403;
        throw error;
    }

    await meetingModel.markTrainerArrival(meetingId);
    return { message: 'הגעת המאמן סומנה בהצלחה' };
};

const getMeetingDetails = async (meetingId) => {
    const [[meeting]] = await meetingModel.getById(meetingId);
    if (!meeting) {
        const error = new Error('המפגש לא נמצא.');
        error.status = 404;
        throw error;
    }

    const participants = await meetingModel.getActiveParticipants(meetingId);
    const waitingList = await meetingModel.getWaitingParticipants(meetingId);
    const fullDetails = { ...meeting, participants, waitingList };
    return fullDetails;
};

// --- עדכון מפגש (כולל תמיכה בסדרות) ---
const updateMeeting = async (meetingId, data, user) => {
    const { participantIds, recurrenceMode, ...meetingData } = data;
    const meetingInfo = { ...meetingData, studio_id: user.studioId };

    const [[originalMeeting]] = await meetingModel.getById(meetingId);
    if (!originalMeeting) throw new Error("Meeting not found");

    // אם מעדכנים סדרה, מסירים שדות זמן כדי לא לדרוס את כל התאריכים לאותו יום
    if (recurrenceMode && recurrenceMode !== 'single') {
        delete meetingInfo.date; 
        // אופציונלי: אפשר למחוק גם start_time ו-end_time אם לא רוצים לשנות שעות לכולם
    }

    // הערה: בדיקות חפיפה (Overlapping) בעדכון המוני הן מורכבות.
    // לצורך פרויקט זה, אנו מבצעים את העדכון ישירות. 
    // אם מעדכנים בודד - עדיין כדאי לבדוק (אפשר להוסיף את הבדיקות כאן כמו ב-createSingleMeeting).

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        let query = `UPDATE meetings SET ? WHERE id = ?`;
        let params = [meetingInfo, meetingId];

        if (originalMeeting.group_id && recurrenceMode !== 'single') {
            if (recurrenceMode === 'all') {
                query = `UPDATE meetings SET ? WHERE group_id = ?`;
                params = [meetingInfo, originalMeeting.group_id];
            } else if (recurrenceMode === 'future') {
                query = `UPDATE meetings SET ? WHERE group_id = ? AND date >= ?`;
                params = [meetingInfo, originalMeeting.group_id, originalMeeting.date];
            }
        }

        await connection.query(query, params);

        // עדכון משתתפים - מתבצע רק אם זה שיעור בודד
        if (participantIds && recurrenceMode === 'single') {
             await connection.query(`DELETE FROM meeting_registrations WHERE meeting_id = ?`, [meetingId]);
             if (participantIds.length > 0) {
                const registrations = participantIds.map(userId => [meetingId, userId, 'active']);
                await connection.query(
                    `INSERT INTO meeting_registrations (meeting_id, user_id, status) VALUES ?`,
                    [registrations]
                );
             }
             await meetingModel.syncParticipantCount(meetingId);
        }

        await connection.commit();
        return getMeetingDetails(meetingId); 
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

// --- מחיקת מפגש (כולל תמיכה בסדרות) ---
const deleteMeeting = async (meetingId, user, recurrenceMode = 'single') => {
    const [[meeting]] = await meetingModel.getById(meetingId);
    if (!meeting) return; 

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. איתור ה-IDs של הפגישות שאנחנו עומדים למחוק
        let findIdsQuery = `SELECT id FROM meetings WHERE id = ?`;
        let findIdsParams = [meetingId];

        if (meeting.group_id && recurrenceMode !== 'single') {
            if (recurrenceMode === 'all') {
                findIdsQuery = `SELECT id FROM meetings WHERE group_id = ?`;
                findIdsParams = [meeting.group_id];
            } else if (recurrenceMode === 'future') {
                findIdsQuery = `SELECT id FROM meetings WHERE group_id = ? AND date >= ?`;
                findIdsParams = [meeting.group_id, meeting.date];
            }
        }

        const [rows] = await connection.query(findIdsQuery, findIdsParams);
        const idsToDelete = rows.map(r => r.id);

        if (idsToDelete.length > 0) {
            // 2. מחיקת ההרשמות קודם (למניעת שגיאת Foreign Key אם אין Cascade)
            await connection.query(`DELETE FROM meeting_registrations WHERE meeting_id IN (?)`, [idsToDelete]);

            // 3. מחיקת הפגישות עצמן
            await connection.query(`DELETE FROM meetings WHERE id IN (?)`, [idsToDelete]);
        }
        
        await connection.commit();
        return { message: 'Meetings deleted successfully' };
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

module.exports = {
    getMeetingsForDashboard,
    getPublicSchedule,
    createMeeting,
    markTrainerArrival,
    getMeetingDetails,
    updateMeeting,
    deleteMeeting
};