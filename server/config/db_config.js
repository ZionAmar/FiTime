require('dotenv').config(); 
const mysql = require('mysql2');

// --- פונקציה חכמה לחישוב אזור זמן ישראל (עובד בכל שרת) ---
const getIsraelOffset = () => {
    try {
        const date = new Date();
        // מבקש מ-Node.js לפרמט את התאריך לפי שעון ירושלים כולל ה-Offset
        // הפלט נראה בערך ככה: "GMT+2" או "GMT+03:00"
        const str = date.toLocaleString('en-US', { 
            timeZone: 'Asia/Jerusalem', 
            timeZoneName: 'longOffset' 
        });
        
        // חותך את החלק הרלוונטי (למשל "+02:00")
        let offset = str.split('GMT')[1]; 
        
        // תיקון פורמט למקרה שקיבלנו רק "+2" (מוסיף אפסים)
        if (offset && offset.length <= 3) { 
            // הופך "+2" ל-"+02:00"
            const [sign, hour] = [offset[0], offset.slice(1)];
            offset = `${sign}${hour.padStart(2, '0')}:00`;
        }
        
        // ברירת מחדל למקרה של שגיאה מוזרה
        return offset || '+02:00';
    } catch (e) {
        console.error("Error calculating timezone, defaulting to +02:00", e);
        return '+02:00';
    }
};

const currentOffset = getIsraelOffset();
console.log(`🌍 חיבור ל-DB ב-ChemiCloud הוגדר עם אזור זמן: ${currentOffset}`);

const pool = mysql.createPool({
    connectionLimit: parseInt(process.env.DB_POOL_SIZE, 10) || 25,
    queueLimit: parseInt(process.env.DB_QUEUE_LIMIT, 10) || 50,
    host: process.env.HOST,
    user: process.env.USER_DB,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    port: process.env.PORT_DB,
    waitForConnections: true,
    dateStrings: true,
    timezone: currentOffset
});

module.exports = pool.promise();