import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api'; 
import LandingPageHeader from '../components/LandingPageHeader';
import { getQuoteOfTheDay } from '../utils/quotes'; 
import '../styles/auth.css'; 

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState(''); 
    const [error, setError] = useState(''); 
    const [isLoading, setIsLoading] = useState(false);
    const quote = getQuoteOfTheDay();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError(''); 
        setIsLoading(true);

try {
       await api.post('/api/auth/forgot-password', { email });
            
       setMessage('קישור לאיפוס סיסמה נשלח אליך למייל.');
    } catch (err) {
        const serverMessage = err.response?.data?.message;

        if (serverMessage) {
            setError(serverMessage); 
        } else {
            setError('שגיאה בתקשורת עם השרת. נסה שנית.');
        }
        console.error('Forgot password error:', err);
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
                        <h2>שכחתי סיסמה</h2>
                        <p style={{ marginBottom: '1rem', color: '#666' }}>
                            הזן את כתובת האימייל המשויכת לחשבונך.
                        </p>
                        <form onSubmit={handleSubmit}>
                            <input
                                type="email"
                                placeholder="אימייל"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                            
                            {error && <p className="error" style={{ marginBottom: '1rem' }}>{error}</p>}
                            {message && <p style={{ color: 'green', marginBottom: '1rem' }}>{message}</p>}

                            <button type="submit" className="btn btn-primary auth-button" disabled={isLoading || message}>
                                {isLoading ? 'שולח...' : 'שלח קישור לאיפוס'}
                            </button>
                        </form>
                        <p className="auth-switch">
                            נזכרת? <Link to="/login">חזרה להתחברות</Link>
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

export default ForgotPassword;