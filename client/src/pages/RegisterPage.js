import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import LandingPageHeader from '../components/LandingPageHeader';
import '../styles/auth.css';
import { getQuoteOfTheDay } from '../utils/quotes';
// ייבוא פונקציות הולידציה החדשות
import { validatePhone, validateEmail } from '../utils/validation';

function RegisterPage() {
    const [formData, setFormData] = useState({
        studio_name: '',
        admin_full_name: '',
        userName: '',
        phone: '', // הוספנו את השדה לסטייט
        email: '',
        password: '',
    });
    const [fieldErrors, setFieldErrors] = useState({});
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const quote = getQuoteOfTheDay();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (fieldErrors[e.target.name]) {
            setFieldErrors(prev => ({ ...prev, [e.target.name]: null }));
        }
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});

        // --- התחלת ולידציה ---
        const errors = {};

        // בדיקת טלפון
        const phoneCheck = validatePhone(formData.phone);
        if (!phoneCheck.isValid) {
            errors.phone = phoneCheck.error;
        }

        // בדיקת מייל
        const emailCheck = validateEmail(formData.email);
        if (!emailCheck.isValid) {
            errors.email = emailCheck.error;
        }

        // בדיקת סיסמה (לפחות 6 תווים)
        if (!formData.password || formData.password.length < 6) {
            errors.password = 'הסיסמה חייבת להכיל לפחות 6 תווים';
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return; // עצירה אם יש שגיאות
        }
        // --- סוף ולידציה ---

        setIsLoading(true);

        // הכנת המידע לשליחה (כולל הטלפון הנקי)
        const dataToSend = {
            ...formData,
            phone: phoneCheck.value // שולחים את המספר הנקי (בלי מקפים)
        };

        try {
            await api.post('/api/auth/register', dataToSend); 
            
            alert('ההרשמה בוצעה בהצלחה! ברוכים הבאים ל-FiTime.');
            navigate('/login');
        } catch (err) {
            const serverResponse = err.response?.data;
            
            if (serverResponse && serverResponse.field) {
                setFieldErrors({ [serverResponse.field]: serverResponse.message });
                setError(''); 
            } else {
                setError(err.message || 'שגיאה לא צפויה ברישום. נסה שנית.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="page-wrapper">
            <LandingPageHeader simplified />
            <main className="auth-page">
                <div className="auth-form-side">
                    <div className="form-container">
                        <h2>יצירת חשבון סטודיו חדש</h2>
                        <p>הצטרפו ל-FiTime וקבלו חודשיים ראשונים חינם!</p>
                        <form onSubmit={handleSubmit}>
                            <input name="studio_name" placeholder="שם הסטודיו" onChange={handleChange} required disabled={isLoading} />
                            {fieldErrors.studio_name && <p className="error field-error">{fieldErrors.studio_name}</p>} 
                            
                            <input name="admin_full_name" placeholder="השם המלא שלך" onChange={handleChange} required disabled={isLoading} />
                            
                            <input name="userName" placeholder="שם משתמש (באנגלית)" onChange={handleChange} required disabled={isLoading} />
                            {fieldErrors.userName && <p className="error field-error">{fieldErrors.userName}</p>} 
                            
                            {/* --- שדה הטלפון החדש --- */}
                            <input 
                                name="phone" 
                                type="tel" 
                                placeholder="טלפון נייד (05X-XXXXXXX)" 
                                onChange={handleChange} 
                                required 
                                disabled={isLoading} 
                                maxLength="12"
                            />
                            {fieldErrors.phone && <p className="error field-error">{fieldErrors.phone}</p>}
                            {/* ---------------------- */}

                            <input name="email" type="email" placeholder="אימייל" onChange={handleChange} required disabled={isLoading} />
                            {fieldErrors.email && <p className="error field-error">{fieldErrors.email}</p>} 
                            
                            <input name="password" type="password" placeholder="סיסמה" onChange={handleChange} required disabled={isLoading} />
                            {fieldErrors.password && <p className="error field-error">{fieldErrors.password}</p>}
                            
                            {error && !Object.values(fieldErrors).some(e => e) && <p className="error">{error}</p>}
                            
                            <button type="submit" disabled={isLoading}>
                                {isLoading ? 'יוצר חשבון...' : 'יצירת חשבון וקבלת ההטבה'}
                            </button>
                        </form>
                        <p className="auth-switch">
                            כבר יש לך חשבון? <Link to="/login">התחבר</Link>
                        </p>
                    </div>
                </div>
                <div className="auth-visual-side">
                    <div className="auth-quote-container">
                        <p className="auth-quote">"{quote}"</p>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default RegisterPage;