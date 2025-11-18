import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 
import '../styles/Footer.css';

function Footer() {
const navigate = useNavigate();
    const { user, activeRole } = useAuth(); 

    const handleLogoClick = () => {
        if (!user) {
            navigate('/');
            return;
        }
        
        const homePath = activeRole === 'owner' ? '/owner-dashboard' : '/dashboard';
        navigate(homePath);
    };
    return (
        <footer className="main-app-footer">
            <div className="main-footer-content">
                <div className="footer-credits">
                    <a 
                        href="https://aztodev.com/" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="aztodev-credit"
                    >
                        נבנה ע"י AzToDev
                    </a>
                </div>
                <span className="copyright-text">
                        © {new Date().getFullYear()} FiTime. כל הזכויות שמורות.
                </span>
                <div className="footer-logo" onClick={handleLogoClick}>
                    <img src="/images/logo.png" alt="FiTime Logo" />
                </div>
            </div>
        </footer>
    );
}

export default Footer;