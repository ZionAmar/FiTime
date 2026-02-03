// src/utils/validation.js

/**
 * מנקה את מספר הטלפון מתווים מיותרים ובודק תקינות
 * חייב להתחיל ב-05 ולהיות באורך 10 ספרות
 */
export const validatePhone = (phone) => {
    if (!phone) return { isValid: false, error: 'שדה חובה', value: '' };

    // משאיר רק ספרות (מוחק מקפים, רווחים וכו')
    const cleanPhone = phone.toString().replace(/\D/g, '');
    
    // בודק: מתחיל ב-05, בדיוק 10 ספרות
    const regex = /^05\d{8}$/;
    
    if (!regex.test(cleanPhone)) {
        return { 
            isValid: false, 
            error: 'מספר טלפון חייב להיות נייד תקין (10 ספרות, מתחיל ב-05)',
            value: cleanPhone
        };
    }
    
    return { isValid: true, value: cleanPhone };
};

/**
 * בדיקת תקינות אימייל בסיסית
 */
export const validateEmail = (email) => {
    if (!email) return { isValid: false, error: 'שדה חובה' };

    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
        return { isValid: false, error: 'כתובת האימייל אינה תקינה' };
    }
    return { isValid: true };
};