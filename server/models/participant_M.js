const db = require('../config/db_config');

// --- ביטלנו את getLocalTime ---
// אנחנו סומכים על ה-DB שיעשה את העבודה עם NOW()

const findExisting = (userId, meetingId) => {
    const query = `SELECT id FROM meeting_registrations WHERE user_id = ? AND meeting_id = ? AND status IN ('active', 'waiting', 'pending')`;
    return db.query(query, [userId, meetingId]);
};

const add = (userId, meetingId, status, userMembershipId, connection) => {
    const dbOrConn = connection || db; 
    // שינוי: שימוש ב-NOW() של SQL במקום לחשב זמן ב-JS
    const query = `INSERT INTO meeting_registrations (user_id, meeting_id, status, user_membership_id, registered_at) VALUES (?, ?, ?, ?, NOW())`;
    return dbOrConn.query(query, [userId, meetingId, status, userMembershipId]);
};

const updateRegistrationStatus = (registrationId, status) => {
    const query = 'UPDATE meeting_registrations SET status = ? WHERE id = ?';
    return db.query(query, [status, registrationId]);
};

const updatePendingStatus = (registrationId) => {
    // שינוי: שימוש ב-NOW() כדי לקבל את הזמן המדויק של השרת ברגע העדכון
    console.log(`Setting pending status for ID ${registrationId} using DB Time`);
    
    const query = `UPDATE meeting_registrations SET 
        status = 'pending', 
        pending_sent_at = NOW(), 
        notification_retries = 1 
        WHERE id = ?`;
    return db.query(query, [registrationId]);
};

const setCheckInTime = (registrationId) => {
    // שינוי: שימוש ב-NOW()
    const query = 'UPDATE meeting_registrations SET status = \'checked_in\', check_in_time = NOW() WHERE id = ?';
    return db.query(query, [registrationId]);
};

const getRegistrationById = (registrationId) => {
    return db.query('SELECT * FROM meeting_registrations WHERE id = ?', [registrationId]);
};

const getNextInWaitingList = (meetingId) => {
    const query = `SELECT 
        mr.id as registration_id,
        u.id as user_id,
        u.full_name,
        u.phone
        FROM meeting_registrations mr
        JOIN users u ON mr.user_id = u.id
        WHERE mr.meeting_id = ? AND mr.status = 'waiting'
        ORDER BY mr.registered_at ASC
        LIMIT 1`;
    return db.query(query, [meetingId]);
};

const findValidMembership = async (userId, studioId) => {
    const query = `SELECT * FROM user_memberships
        WHERE user_id = ? 
        AND studio_id = ?
        AND status = 'active'
        AND (expiry_date IS NULL OR expiry_date >= CURDATE())
        AND (visits_remaining IS NULL OR visits_remaining > 0)
        ORDER BY 
        expiry_date ASC,
        visits_remaining ASC
        LIMIT 1`;
    const [[membership]] = await db.query(query, [userId, studioId]);
    return membership || null;
};

const decrementVisit = (membershipId, connection) => {
    const dbOrConn = connection || db;
    const query = `UPDATE user_memberships 
        SET visits_remaining = visits_remaining - 1
        WHERE id = ? AND visits_remaining > 0`;
    return dbOrConn.query(query, [membershipId]);
};

const updateMembershipStatus = (membershipId, status, connection) => {
    const dbOrConn = connection || db;
    const query = `UPDATE user_memberships SET status = ? WHERE id = ?`;
    return dbOrConn.query(query, [status, membershipId]);
};

const incrementMeetingCount = (meetingId, connection) => {
    const dbOrConn = connection || db;
    const query = `UPDATE meetings SET participant_count = participant_count + 1 WHERE id = ?`;
    return dbOrConn.query(query, [meetingId]);
};

const decrementMeetingCount = (meetingId, connection) => {
    const dbOrConn = connection || db;
    const query = `UPDATE meetings SET participant_count = participant_count - 1 WHERE id = ? AND participant_count > 0`;
    return dbOrConn.query(query, [meetingId]);
};

const getMembershipById = (membershipId, connection) => {
    const dbOrConn = connection || db;
    const query = `SELECT * FROM user_memberships WHERE id = ?`;
    return dbOrConn.query(query, [membershipId]);
};

const incrementVisit = (membershipId, connection) => {
    const dbOrConn = connection || db;
    const query = `UPDATE user_memberships 
        SET visits_remaining = visits_remaining + 1
        WHERE id = ?`;
    return dbOrConn.query(query, [membershipId]);
};

const updateRegistrationStatusAndMembership = (registrationId, status, membershipId, connection) => {
    const dbOrConn = connection || db;
    const query = `UPDATE meeting_registrations 
        SET status = ?, user_membership_id = ? 
        WHERE id = ?`;
    return dbOrConn.query(query, [status, membershipId, registrationId]);
};

// --- החלק הקריטי המתוקן ---
const findStalePendingRegistrations = async (minutes) => {
    console.log(`CRON: Checking for registrations older than ${minutes} minutes using DB logic`);

    // שינוי: חישוב הזמן נעשה כולו ב-MySQL
    // אנו בודקים אם הזמן שעבר מאז pending_sent_at גדול מ-X דקות
    // זה פותר את כל בעיות ה-Timezone בין Node ל-DB
    const query = `
        SELECT mr.*, u.phone, u.full_name
        FROM meeting_registrations mr
        JOIN users u ON mr.user_id = u.id
        WHERE mr.status = 'pending'
          AND mr.pending_sent_at IS NOT NULL
          AND mr.pending_sent_at < (NOW() - INTERVAL ? MINUTE)
    `;
    return db.query(query, [minutes]);
};

const updateRetryTimestamp = (registrationId) => {
    // שינוי: שימוש ב-NOW()
    const query = `UPDATE meeting_registrations SET
        pending_sent_at = NOW(),
        notification_retries = notification_retries + 1
        WHERE id = ?`;
    return db.query(query, [registrationId]);
};

const getPendingCount = async (meetingId) => {
    const query = `SELECT COUNT(*) as count FROM meeting_registrations WHERE meeting_id = ? AND status = 'pending'`;
    const [[result]] = await db.query(query, [meetingId]);
    return result.count;
};

// פונקציית עזר ליצירת זמן מקומי - למקרה שתצטרך אותה במקום אחר (לא בשימוש בקובץ זה יותר ללוגיקה)
const getLocalTime = () => {
    const now = new Date();
    const options = {
        timeZone: "Asia/Jerusalem",
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
    };
    return new Intl.DateTimeFormat('en-US', options).format(now);
};

module.exports = {
    findExisting,
    add,
    updateRegistrationStatus,
    updatePendingStatus, 
    setCheckInTime, 
    getRegistrationById,
    getNextInWaitingList,
    findValidMembership,
    decrementVisit,
    updateMembershipStatus,
    incrementMeetingCount,
    decrementMeetingCount,
    getMembershipById,
    incrementVisit,
    updateRegistrationStatusAndMembership,
    findStalePendingRegistrations, // הפונקציה המתוקנת
    updateRetryTimestamp,
    getPendingCount,
    getLocalTime
};