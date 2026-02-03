const axios = require('axios');
const meetingModel = require('../models/meeting_M');
require('dotenv').config();

const API_URL = 'https://www.019sms.co.il/api';

async function sendSmsWithConfirmLink(to, meetingId, registrationId, isReminder = false) {
    try {
        const [[meeting]] = await meetingModel.getById(meetingId);
        if (!meeting) {
            console.error(`❌ SMS Error: Meeting ID ${meetingId} not found.`);
            return;
        }

        // כאן הקסם: לוקחים את שם הסטודיו מה-DB, או כותבים "הסטודיו" אם אין שם
        const studioName = meeting.studio_name || 'הסטודיו';

        const meetingDate = new Date(meeting.date).toLocaleDateString('he-IL', {day: '2-digit', month: '2-digit'});
        const meetingTime = meeting.start_time.slice(0, 5);
        
        const confirmLink = `${process.env.SERVER_URL}/api/participants/confirm/${registrationId}`;
        const declineLink = `${process.env.SERVER_URL}/api/participants/decline/${registrationId}`;

        let messageBody = '';

        // --- עיצוב ההודעה עם שם הסטודיו ---
        
        if (isReminder) {
            messageBody = `תזכורת מ-${studioName} ⏳
שמרנו לך מקום בשיעור ${meeting.name}!
📅 מתי: ${meetingDate} ב-${meetingTime}

המקום שמור לזמן מוגבל, נא לאשר הגעה:
✅ לאישור: ${confirmLink}

❌ לביטול: ${declineLink}`;

        } else {
            messageBody = `היי, חדשות טובות מ-${studioName}! 🥳
התפנה מקום בשיעור שרצית: ${meeting.name}
📅 מתי: ${meetingDate} ב-${meetingTime}

רוצה להצטרף?
✅ לחץ לאישור מיידי:
${confirmLink}

לא מסתדר? לחץ כאן:
${declineLink}`;
        }

        // --- בניית ה-JSON ---
        const payload = {
            sms: {
                user: {
                    username: process.env.SMS_019_USER,
                    password: process.env.SMS_019_PASSWORD
                },
                source: process.env.SMS_019_SENDER, // נשאר קבוע: AZTODEV
                destinations: {
                    phone: formatPhoneNumber(to)
                },
                message: messageBody
            }
        };

        console.log(`📤 שולח SMS ל-${to} (עבור ${studioName})...`);

        const response = await axios.post(API_URL, payload, {
            headers: { 'Content-Type': 'application/json' }
        });

        const data = response.data;
        
        if (data.status === 0 || data.status === '0') {
            console.log(`✅ SMS נשלח בהצלחה!`);
        } else {
            console.error(`❌ שגיאת 019: ${data.status} - ${data.message}`);
        }

    } catch (err) {
        console.error('❌ שגיאת רשת/שרת:', err.message);
    }
}

function formatPhoneNumber(phone) {
    if (phone.startsWith('0')) return '972' + phone.slice(1);
    if (phone.startsWith('+')) return phone.slice(1);
    return phone;
}

module.exports = { sendSmsWithConfirmLink };