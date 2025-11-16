import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../styles/MyMembershipsPage.css'; 

function MyMembershipsPage() {
    const [memberships, setMemberships] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth(); 

    useEffect(() => {
        const fetchMemberships = async () => {
            if (!user) return; 

            setIsLoading(true);
            try {
                const data = await api.get(`/api/memberships/user/${user.id}`);
                setMemberships(data);
                setError('');
            } catch (err) {
                setError(err.message || 'שגיאה בטעינת המנויים שלך');
            } finally {
                setIsLoading(false);
            }
        };

        fetchMemberships();
    }, [user]); 

    const renderMembershipCard = (mem) => {
        const isDepleted = mem.visits_remaining === 0;
        const isExpired = mem.expiry_date && new Date(mem.expiry_date) < new Date();
        let statusText = 'פעיל';
        let statusClass = 'active';

        if (isExpired) {
            statusText = 'פג תוקף';
            statusClass = 'expired';
        } else if (isDepleted) {
            statusText = 'נוצלו כל הניקובים';
            statusClass = 'depleted';
        } else if (mem.status === 'pending') {
            statusText = 'ממתין להפעלה';
            statusClass = 'pending';
        }

        return (
            <div key={mem.id} className={`membership-card ${statusClass}`}>
                <div className="membership-card-header">
                    <h3>{mem.product_name}</h3>
                    <span className={`status-badge ${statusClass}`}>{statusText}</span>
                </div>
                <div className="membership-card-body">
                    <div className="membership-stat">
                        <strong>ניקובים:</strong>
                        <span>{mem.visits_remaining === null ? 'ללא הגבלה' : `${mem.visits_remaining} / ${mem.total_visits || '?'}`}</span>
                    </div>
                    <div className="membership-stat">
                        <strong>תוקף עד:</strong>
                        <span>{mem.expiry_date ? new Date(mem.expiry_date).toLocaleDateString('he-IL') : 'ללא הגבלה'}</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="container my-memberships-page">
            <header className="page-header">
                <h1>המנויים שלי</h1>
                <p>כאן תוכל לראות את כל הכרטיסיות והמנויים הפעילים והלא פעילים שלך.</p>
            </header>

            {isLoading && <div className="loading">טוען את המנויים שלך...</div>}
            {error && <div className="error-message" style={{ color: 'red' }}>{error}</div>}

            {!isLoading && !error && (
                <div className="memberships-grid">
                    {memberships.length > 0 ? (
                        memberships.map(renderMembershipCard)
                    ) : (
                        <p>לא נמצאו מנויים על שמך. לרכישה, אנא פנה למנהל הסטודיו.</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default MyMembershipsPage;