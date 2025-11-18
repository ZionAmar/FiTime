const meetingModel = require('../models/meeting_M');
const participantModel = require('../models/participant_M');
const userModel = require('../models/user_M'); 
const smsService = require('../utils/sms_S'); 
const db = require('../config/db_config'); 
const cron = require('node-cron'); 

async function processWaitingList(meetingId) {
    const [[meeting]] = await meetingModel.getById(meetingId);
    if (!meeting || meeting.participant_count >= meeting.capacity) { return; }
    const [[nextInLine]] = await participantModel.getNextInWaitingList(meetingId);
    if (!nextInLine) { return; }
    
    await participantModel.updatePendingStatus(nextInLine.registration_id); 
    
    await smsService.sendSmsWithConfirmLink(nextInLine.phone, meetingId, nextInLine.registration_id, false);
}

const addParticipant = async (user, meetingId, forceWaitlist = false) => {
    const { id: userId, studioId: activeStudioId, roles: activeRoles } = user; 
    const [[meeting]] = await meetingModel.getById(meetingId);
    if (!meeting) {
        const error = new Error('השיעור המבוקש לא נמצא.');
        error.status = 404;
        throw error;
    }
    const [[existing]] = await participantModel.findExisting(userId, meetingId);
    if (existing) {
        const error = new Error('אתה כבר רשום לשיעור זה או נמצא ברשימת ההמתנה.');
        error.status = 409;
        error.errorType = 'ALREADY_REGISTERED';
        throw error;
    }
    let validMembership = null;
    const [allUserRoles] = await userModel.findStudiosAndRolesByUserId(userId);
    const isOwner = allUserRoles.some(r => r.role_name === 'owner');
    const isAdminForThisStudio = allUserRoles.some(r => 
        r.role_name === 'admin' && r.studio_id === meeting.studio_id
    );
    const isPrivilegedUser = isOwner || isAdminForThisStudio;
    if (!isPrivilegedUser) {
        validMembership = await participantModel.findValidMembership(userId, meeting.studio_id); 
        if (!validMembership) {
            const error = new Error('אין לך מנוי פעיל או שנגמרו לך הניקובים. אנא פנה למנהל הסטודיו.');
            error.status = 402; 
            error.errorType = 'NO_MEMBERSHIP';
            throw error;
        }
    }
    const isFull = meeting.participant_count >= meeting.capacity;
    let status = 'active';
    if (isFull) {
        if (!forceWaitlist) {
            const waitingList = await meetingModel.getWaitingParticipants(meetingId);
            const waitlistCount = waitingList.length;
            const message = `השיעור מלא. ${waitlistCount > 0 ? `כבר יש ${waitlistCount} אנשים ברשימת ההמתנה.` : ''} האם תרצה להצטרף לרשימת המתנה?`;
            const error = new Error(message);
            error.status = 409;
            error.errorType = 'CLASS_FULL';
            error.waitlistCount = waitlistCount;
            throw error;
        }
        status = 'waiting'; 
    }
    const connection = await db.getConnection();
    await connection.beginTransaction();
    try {
        const [result] = await participantModel.add(
            userId, 
            meetingId, 
            status, 
            validMembership ? validMembership.id : null, 
            connection
        );
        if (status === 'active') {
            await participantModel.incrementMeetingCount(meetingId, connection); 
            if (validMembership && validMembership.visits_remaining !== null) {
                await participantModel.decrementVisit(validMembership.id, connection);
                if (validMembership.visits_remaining - 1 === 0) {
                    await participantModel.updateMembershipStatus(validMembership.id, 'depleted', connection);
                }
            }
        }
        await connection.commit();
        connection.release();
        return { id: result.insertId, userId, meetingId, status };
    } catch (err) {
        await connection.rollback();
        connection.release();
        console.error("Error in addParticipant transaction:", err); 
        throw new Error('שגיאה פנימית בעת נסיון הרישום.'); 
    }
};

const cancelRegistration = async (registrationId, user) => {
    const [[registration]] = await participantModel.getRegistrationById(registrationId);
    if (!registration) {
        const error = new Error('ההרשמה לא נמצאה.');
        error.status = 404;
        throw error;
    }
    if (registration.user_id !== user.id && !user.roles.includes('admin')) {
        const error = new Error('אין לך הרשאה לבטל הרשמה זו.');
        error.status = 403;
        throw error;
    }
    const [[meeting]] = await meetingModel.getById(registration.meeting_id);
    if (!meeting) {
        const error = new Error('השיעור המשויך להרשמה זו לא נמצא.');
        error.status = 404;
        throw error;
    }
    const meetingStartTime = new Date(`${meeting.date}T${meeting.start_time}`);
    const now = new Date();
    const diffMs = meetingStartTime.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const isLateCancel = diffHours < 24;
    const connection = await db.getConnection();
    await connection.beginTransaction();
    try {
        await participantModel.updateRegistrationStatus(registrationId, 'cancelled');
        if (registration.status === 'active') {
            await participantModel.decrementMeetingCount(registration.meeting_id, connection);
        }
        if (registration.user_membership_id) {
            if (!isLateCancel) {
                const [[membership]] = await participantModel.getMembershipById(registration.user_membership_id, connection);
                if (membership && membership.visits_remaining !== null) {
                    await participantModel.incrementVisit(membership.id, connection);
                    if (membership.status === 'depleted') {
                        await participantModel.updateMembershipStatus(membership.id, 'active', connection);
                    }
                }
            } else {
                console.log(`Late cancellation by user ${user.id} for registration ${registrationId}. No refund given.`);
            }
        }
        await connection.commit(); 
        connection.release(); 
        await processWaitingList(registration.meeting_id); 
        return { message: 'ההרשמה בוטלה בהצלחה.' };
    } catch (err) {
        await connection.rollback();
        connection.release();
        console.error("Error in cancelRegistration transaction:", err);
        throw new Error('שגיאה פנימית בעת ביטול הרישום.');
    }
};

const checkInParticipant = async (registrationId, user) => {
    const [[registration]] = await participantModel.getRegistrationById(registrationId);
    if (!registration) {
        const error = new Error('ההרשמה לא נמצאה.');
        error.status = 404;
        throw error;
    }
    const [[meeting]] = await meetingModel.getById(registration.meeting_id);
    if (!meeting) {
        const error = new Error('השיעור לא נמצא.');
        error.status = 404;
        throw error;
    }
    if (user.id !== meeting.trainer_id && !user.roles.includes('admin')) {
        const error = new Error('אין לך הרשאה לבצע צ\'ק-אין לשיעור זה.');
        error.status = 403;
        throw error;
    }
    await participantModel.setCheckInTime(registrationId);
    return { message: 'המתאמן עודכן בהצלחה.' };
};

const confirmSpot = async (registrationId) => {
    const [[registration]] = await participantModel.getRegistrationById(registrationId);
    if (!registration) {
        throw new Error('ההרשמה לא נמצאה.');
    }
    if (registration.status !== 'pending') {
        throw new Error('המקום הזה כבר לא זמין.');
    }
    const [[meeting]] = await meetingModel.getById(registration.meeting_id);
    if (meeting.participant_count >= meeting.capacity) {
        await participantModel.updateRegistrationStatus(registrationId, 'waiting');
        throw new Error('מצטערים, המקום נתפס. הוחזרת לרשימת ההמתנה.');
    }
    const [[user]] = await userModel.getById(registration.user_id); 
    const studioId = meeting.studio_id; 
    const [rolesData] = await userModel.findStudiosAndRolesByUserId(user.id);
    const isOwner = rolesData.some(r => r.role_name === 'owner');
    const isAdminForThisStudio = rolesData.some(r => 
        r.role_name === 'admin' && r.studio_id === meeting.studio_id
    );
    const isPrivilegedUser = isOwner || isAdminForThisStudio;
    let validMembership = null;
    if (!isPrivilegedUser) {
        validMembership = await participantModel.findValidMembership(user.id, studioId);
        if (!validMembership) {
            await participantModel.updateRegistrationStatus(registrationId, 'cancelled');
            await processWaitingList(meeting.id); 
            throw new Error('אין לך מנוי פעיל ולכן לא ניתן לאשר את המקום.');
        }
    }
    const connection = await db.getConnection();
    await connection.beginTransaction();
    try {
        await participantModel.updateRegistrationStatusAndMembership(
            registrationId, 
            'active', 
            validMembership ? validMembership.id : null,
            connection
        );
        await participantModel.incrementMeetingCount(registration.meeting_id, connection);
        if (validMembership && validMembership.visits_remaining !== null) {
            await participantModel.decrementVisit(validMembership.id, connection);
            if (validMembership.visits_remaining - 1 === 0) {
                await participantModel.updateMembershipStatus(validMembership.id, 'depleted', connection);
            }
        }
        await connection.commit();
        connection.release();
        return { message: 'המקום אושר בהצלחה.' };
    } catch (err) {
        await connection.rollback();
        connection.release();
        console.error("Error in confirmSpot transaction:", err);
        throw new Error('שגיאה פנימית בעת אישור המקום.');
    }
};

const declineSpot = async (registrationId) => {
    const [[registration]] = await participantModel.getRegistrationById(registrationId);
    if (!registration) {
        const error = new Error('ההרשמה לא נמצאה.');
        error.status = 404;
        throw error;
    }
    if (registration.status === 'pending') {
        await participantModel.updateRegistrationStatus(registrationId, 'cancelled');
        await processWaitingList(registration.meeting_id);
    }
    return { message: 'המקום נדחה.' };
};

const CHECK_INTERVAL = '0,30 * * * *';

const startWaitingListCronJob = () => {
    console.log('🕒 Starting Waiting List Monitor (Cron Job)...');

    cron.schedule(CHECK_INTERVAL, async () => {
        console.log('CRON: Checking for stale pending registrations...');
        
        try {
            const [staleRegistrations] = await participantModel.findStalePendingRegistrations(0.5);
            
            if (staleRegistrations.length === 0) {
                console.log('CRON: No stale registrations found.');
                return;
            }

            for (const reg of staleRegistrations) {
                console.log(`CRON: Found stale registration ${reg.id} (User: ${reg.user_id})`);

                if (reg.notification_retries === 1) {
                    console.log(`CRON: Resending notification (reminder) for registration ${reg.id}`);
                    
                    await smsService.sendSmsWithConfirmLink(reg.phone, reg.meeting_id, reg.id, true); 
                    
                    await participantModel.updateRetryTimestamp(reg.id);

                } else if (reg.notification_retries >= 2) {
                    console.log(`CRON: Auto-cancelling registration ${reg.id} (60+ minutes passed)`);
                    
                    await declineSpot(reg.id);
                }
            }

        } catch (err) {
            console.error('CRON ERROR: Failed during stale check:', err);
        }
    });
};


module.exports = {
    addParticipant,
    cancelRegistration,
    processWaitingList,
    checkInParticipant,
    confirmSpot,
    declineSpot,
    startWaitingListCronJob
};