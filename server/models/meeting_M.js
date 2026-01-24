const db = require('../config/db_config');

const extractRows = (result) => result[0];

const getWaitingListCountQuery = `
    (SELECT COUNT(*) 
     FROM meeting_registrations mr 
     WHERE mr.meeting_id = m.id AND mr.status = 'waiting'
    ) as waiting_list_count
`;

const getAllByStudioId = (studioId, date) => {
    // הוספתי כאן את m.group_id
    let query = `
        SELECT 
            m.id, m.name, m.trainer_id, m.room_id, m.participant_count, m.group_id,
            CONCAT(m.date, 'T', m.start_time) as start,
            CONCAT(m.date, 'T', m.end_time) as end,
            u.full_name as trainerName,
            r.name as roomName,
            r.capacity,
            m.trainer_arrival_time,
            ${getWaitingListCountQuery}
        FROM meetings m
        JOIN users u ON m.trainer_id = u.id
        JOIN rooms r ON m.room_id = r.id
        WHERE m.studio_id = ?
    `;
    const params = [studioId];
    if (date) {
        query += ' AND m.date = ?';
        params.push(date);
    }
    return db.query(query, params).then(extractRows);
};

const getByTrainerId = (trainerId, studioId, date) => {
    // הוספתי כאן את m.group_id
    let query = `
        SELECT 
            m.id, m.name, m.trainer_id, m.room_id, m.participant_count, m.group_id,
            CONCAT(m.date, 'T', m.start_time) as start,
            CONCAT(m.date, 'T', m.end_time) as end,
            u.full_name as trainerName,
            r.name as roomName,
            r.capacity,
            m.trainer_arrival_time,
            ${getWaitingListCountQuery}
        FROM meetings m
        JOIN users u ON m.trainer_id = u.id
        JOIN rooms r ON m.room_id = r.id
        WHERE m.trainer_id = ? AND m.studio_id = ?
    `;
    const params = [trainerId, studioId];
    if (date) {
        query += ' AND m.date = ?';
        params.push(date);
    }
    return db.query(query, params).then(extractRows);
};

const getByMemberId = (memberId, studioId, date) => {
    // הוספתי כאן את m.group_id
    let query = `
        SELECT 
            m.id, 
            mr.id as registrationId,
            m.name, m.trainer_id, m.room_id, m.participant_count, m.group_id,
            CONCAT(m.date, 'T', m.start_time) as start,
            CONCAT(m.date, 'T', m.end_time) as end,
            mr.status, 
            u.full_name as trainerName,
            r.name as roomName,
            r.capacity,
            ${getWaitingListCountQuery}
        FROM meetings AS m
        JOIN meeting_registrations AS mr ON m.id = mr.meeting_id
        JOIN users u ON m.trainer_id = u.id
        JOIN rooms r ON m.room_id = r.id
        WHERE mr.user_id = ? 
          AND m.studio_id = ?
          AND mr.status != 'cancelled'
    `;
    const params = [memberId, studioId];
    
    if (date) {
        query += ' AND m.date = ?';
        params.push(date);
    }
    
    return db.query(query, params).then(result => result[0]);
};

const getPublicSchedule = (studioId, date) => {
    // הוספתי כאן את m.group_id
    let query = `
        SELECT 
            m.id, m.name, m.group_id, u.full_name as trainerName, r.name as roomName, r.capacity, m.participant_count,
            CONCAT(m.date, 'T', m.start_time) as start,
            CONCAT(m.date, 'T', m.end_time) as end,
            ${getWaitingListCountQuery}
        FROM meetings m
        JOIN users u ON m.trainer_id = u.id 
        JOIN rooms r ON m.room_id = r.id
        WHERE m.date >= CURDATE() AND m.studio_id = ?
    `;
    return db.query(query, [studioId]);
};

const getById = (id) => {
    // הוספתי m.group_id באופן מפורש ליתר ביטחון, למרות ש-m.* אמור לתפוס אותו
    const query = `
        SELECT m.*, m.group_id, r.name as roomName, r.capacity, u.full_name as trainerName 
        FROM meetings m 
        JOIN rooms r ON m.room_id = r.id 
        JOIN users u ON m.trainer_id = u.id
        WHERE m.id = ?
    `;
    return db.query(query, [id]);
};


const findOverlappingMeeting = ({ date, start_time, end_time, room_id, studio_id }) => {
    const query = `SELECT id FROM meetings WHERE room_id = ? AND date = ? AND start_time < ? AND end_time > ? AND studio_id = ?`;
    return db.query(query, [room_id, date, end_time, start_time, studio_id]);
};

const create = async (meetingData, participantIds) => {
    // הוספתי group_id
    const { studio_id, name, trainer_id, date, start_time, end_time, room_id, group_id } = meetingData;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [result] = await connection.query(
            `INSERT INTO meetings (studio_id, name, trainer_id, date, start_time, end_time, room_id, group_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [studio_id, name, trainer_id, date, start_time, end_time, room_id, group_id || null]
        );
        const meetingId = result.insertId;
        if (participantIds && participantIds.length > 0) {
            const registrations = participantIds.map(userId => [meetingId, userId, 'active']);
            await connection.query(
                `INSERT INTO meeting_registrations (meeting_id, user_id, status) VALUES ?`,
                [registrations]
            );
        }
        await connection.commit();
        await syncParticipantCount(meetingId);
        return { insertId: meetingId };
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

const getActiveParticipants = (meetingId) => {
    const query = `
        SELECT u.id, u.full_name, mr.status, mr.id as registrationId, mr.check_in_time
        FROM users u 
        JOIN meeting_registrations mr ON u.id = mr.user_id 
        WHERE mr.meeting_id = ? AND mr.status IN ('active', 'checked_in')
    `;
    return db.query(query, [meetingId]).then(extractRows);
};

const findOverlappingMeetingForTrainer = ({ date, start_time, end_time, trainer_id, studio_id }, excludeMeetingId = null) => {
    let query = `
        SELECT m.id, m.name, u.full_name as trainerName 
        FROM meetings m
        JOIN users u ON m.trainer_id = u.id
        WHERE m.trainer_id = ? AND m.date = ? AND m.start_time < ? AND m.end_time > ? AND m.studio_id = ?`;
    const params = [trainer_id, date, end_time, start_time, studio_id];
    if (excludeMeetingId) {
        query += ` AND m.id != ?`;
        params.push(excludeMeetingId);
    }
    return db.query(query, params).then(result => result[0]);
};

const findOverlappingMeetingsForParticipants = ({ date, start_time, end_time, studio_id }, participantIds = [], excludeMeetingId = null) => {
    if (!participantIds || participantIds.length === 0) {
        return Promise.resolve([]);
    }
    let query = `
        SELECT DISTINCT u.full_name
        FROM users u
        JOIN meeting_registrations mr ON u.id = mr.user_id
        JOIN meetings m ON mr.meeting_id = m.id
        WHERE u.id IN (?) AND mr.status IN ('active', 'checked_in', 'pending') AND m.date = ? AND m.start_time < ? AND m.end_time > ? AND m.studio_id = ?
    `;
    const params = [participantIds, date, end_time, start_time, studio_id];
    if (excludeMeetingId) {
        query += ` AND m.id != ?`;
        params.push(excludeMeetingId);
    }
    return db.query(query, params).then(result => result[0]);
};

const getWaitingParticipants = (meetingId) => {
    const query = `SELECT u.id, u.full_name, mr.status, mr.id as registrationId FROM users u JOIN meeting_registrations mr ON u.id = mr.user_id WHERE mr.meeting_id = ? AND mr.status = 'waiting'`;
    return db.query(query, [meetingId]).then(extractRows);
};

const markTrainerArrival = (meetingId) => {
    const query = `UPDATE meetings SET trainer_arrival_time = NOW() WHERE id = ? AND trainer_arrival_time IS NULL`;
    return db.query(query, [meetingId]);
};

const update = async (meetingId, meetingData, participantIds) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        // הוספתי כאן טיפול במקרה של עדכון
        // שים לב: אנחנו לא מעדכנים את ה-group_id בדרך כלל בעריכה רגילה
        const { name, trainer_id, date, start_time, end_time, room_id } = meetingData;
        await connection.query(
            `UPDATE meetings SET name=?, trainer_id=?, date=?, start_time=?, end_time=?, room_id=? WHERE id=?`,
            [name, trainer_id, date, start_time, end_time, room_id, meetingId]
        );
        
        // מחיקת והוספת משתתפים (רק אם נשלחו)
        await connection.query(`DELETE FROM meeting_registrations WHERE meeting_id = ?`, [meetingId]);
        if (participantIds && participantIds.length > 0) {
            const registrations = participantIds.map(userId => [meetingId, userId, 'active']);
            await connection.query(
                `INSERT INTO meeting_registrations (meeting_id, user_id, status) VALUES ?`,
                [registrations]
            );
        }
        await connection.commit();
        await syncParticipantCount(meetingId);
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

const remove = async (meetingId) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query(`DELETE FROM meeting_registrations WHERE meeting_id = ?`, [meetingId]);
        await connection.query(`DELETE FROM meetings WHERE id = ?`, [meetingId]);
        await connection.commit();
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

const syncParticipantCount = (meetingId) => {
    const query = `
        UPDATE meetings m SET m.participant_count = (
            SELECT COUNT(*) FROM meeting_registrations mr 
            WHERE mr.meeting_id = ? AND mr.status = 'active'
        ) WHERE m.id = ?
    `;
    return db.query(query, [meetingId, meetingId]);
};

module.exports = {
    getAllByStudioId,
    getByTrainerId,
    getByMemberId,
    getPublicSchedule,
    getActiveParticipants,
    getWaitingParticipants,
    findOverlappingMeeting,
    create,
    getById, 
    markTrainerArrival,
    syncParticipantCount, 
    update,
    remove,
    findOverlappingMeetingForTrainer,
    findOverlappingMeetingsForParticipants
};