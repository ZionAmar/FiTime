const twilio = require('twilio');
const meetingModel = require('../models/meeting_M');
require('dotenv').config();

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
const FROM = process.env.TWILIO_SMS_NUMBER;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

/**
 * @param {string} to - מספר הטלפון
 * @param {number} meetingId - ID השיעור
 * @param {number} registrationId - ID הרישום
 * @param {boolean} isReminder - האם זו הודעת תזכורת (ההזדמנות השנייה)
 */
async function sendSmsWithConfirmLink(to, meetingId, registrationId, isReminder = false) {
    try {
        const [[meeting]] = await meetingModel.getById(meetingId);
        if (!meeting) {
            const error = new Error(`לא ניתן למצוא את השיעור (ID ${meetingId}) לצורך שליחת SMS.`);
            error.status = 404;
            throw error;
        }

        const meetingDate = new Date(meeting.date).toLocaleDateString('he-IL', {day: '2-digit', month: '2-digit', year: 'numeric'});
        const meetingTime = meeting.start_time.slice(0, 5);

        const confirmLink = `${process.env.SERVER_URL}/api/participants/confirm/${registrationId}`;
        const declineLink = `${process.env.SERVER_URL}/api/participants/decline/${registrationId}`;

        let messageBody = '';

        if (isReminder) {
            messageBody = `תזכורת מ-FiTime: עדיין מחכים לאישור שלך לשיעור '${meeting.name}' בתאריך ${meetingDate} בשעה ${meetingTime}.
אם לא תגיב בשעות הקרובות, הרשמתך תבוטל אוטומטית והמקום יעבור לבא בתור.
אשר: ${confirmLink}
בטל: ${declineLink}`;
        } else {
            messageBody = `היי מ-FiTime! התפנה מקום בשיעור שרצית:
✨ שיעור: ${meeting.name}
📅 תאריך: ${meetingDate}
⏰ שעה: ${meetingTime}

לאישור ההרשמה:
${confirmLink}

לוויתור על המקום:
${declineLink}`;
        }

        await client.messages.create({
            from: FROM,
            to: formatPhoneNumber(to), 
            body: messageBody,
        });
        console.log(`SMS (Reminder: ${isReminder}) נשלחה אל ${to} עבור הרשמה ${registrationId}`);
    } catch (err) {
        if (err.status === 404) {
            throw err;
        }
        console.error('שגיאה בשליחת SMS:', err.message);
    }
}

function formatPhoneNumber(phone) {
    if (phone.startsWith('0')) {
        return '+972' + phone.slice(1);
    }
    if (!phone.startsWith('+')) {
        return '+' + phone;
    }
    return phone;
}

module.exports = { sendSmsWithConfirmLink };