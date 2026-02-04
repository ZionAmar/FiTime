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

        const studioName = meeting.studio_name || 'הסטודיו';
        
        // תאריך ושעה (04/02 18:00)
        const meetingDate = new Date(meeting.date).toLocaleDateString('he-IL', {day: '2-digit', month: '2-digit'});
        const meetingTime = meeting.start_time.slice(0, 5);
        
        const confirmLink = `${process.env.SERVER_URL}/api/participants/confirm/${registrationId}`;
        const declineLink = `${process.env.SERVER_URL}/api/participants/decline/${registrationId}`;

        let messageBody = '';

        // --- גרסה מאוזנת (נראית טוב, עלות: 2 הודעות) ---
        
        if (isReminder) {
            // תזכורת
            messageBody = `${studioName} ⏳\nתזכורת ל-${meeting.name}\n${meetingDate} ${meetingTime}\n✅ לאישור: ${confirmLink}\n❌ לביטול: ${declineLink}`;

        } else {
            // רשימת המתנה - החזרנו את האימוג'י ואת שם השיעור
            messageBody = `${studioName} 🥳\nהתפנה מקום ב-${meeting.name}!\n${meetingDate} ${meetingTime}\n✅ לאישור: ${confirmLink}\n❌ לביטול: ${declineLink}`;
        }

        // --- סוף גרסה ---

        const payload = {
            sms: {
                user: {
                    username: process.env.SMS_019_USER,
                    password: process.env.SMS_019_PASSWORD
                },
                source: process.env.SMS_019_SENDER,
                destinations: {
                    phone: formatPhoneNumber(to)
                },
                message: messageBody
            }
        };

        // לוג שיעזור לך לעקוב אחרי האורך
        console.log(`📤 שולח SMS ל-${to}. אורך: ${messageBody.length} תווים.`);

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
    if (!phone) return '';
    let p = phone.replace(/\D/g, ''); 
    if (p.startsWith('0')) return '972' + p.slice(1);
    if (p.startsWith('972')) return p;
    return '972' + p; 
}

module.exports = { sendSmsWithConfirmLink };