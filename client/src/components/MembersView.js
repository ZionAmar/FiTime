import React, { useState, useEffect } from 'react';
import api from '../services/api';
import UserModal from '../components/UserModal';
import ConfirmModal from '../components/ConfirmModal'; // 1. ייבוא המודל החדש
import '../styles/TrainersView.css'; 

function MembersView() {
    const [members, setMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingUser, setEditingUser] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    // 2. החלפת הלוגיקה של האישור
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {}
    });

    const fetchMembers = async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await api.get('/api/users/all?role=member');
            setMembers(data);
        } catch (err) {
            setError(err.message || 'שגיאה בטעינת המתאמנים');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);
    
    const handleSave = () => {
        setEditingUser(null);
        setIsAddModalOpen(false);
        fetchMembers(); 
    };

    // 3. פישוט פונקציית המחיקה - היא רק פותחת את המודל
    const handleDelete = (member) => {
        setError(''); // נקה שגיאות ישנות
        setConfirmState({
            isOpen: true,
            title: 'אישור מחיקת מתאמן',
            message: `האם אתה בטוח שברצונך למחוק את ${member.full_name}? פעולה זו תסיר אותו מהסטודיו לצמיתות.`,
            onConfirm: () => performDelete(member.id), // הגדרת הפעולה שתרוץ באישור
            confirmText: 'כן, מחק',
            confirmButtonType: 'btn-danger'
        });
    };

    // 4. פונקציה חדשה שמבצעת את המחיקה בפועל
    const performDelete = async (memberId) => {
        setConfirmState({ isOpen: false }); // סגור את המודל
        setError('');
        setIsLoading(true);
        try {
            await api.delete(`/api/users/${memberId}`);
            fetchMembers();
        } catch (err) {
            setError(err.message || 'שגיאה במחיקת המתאמן.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setError('');
    };
    
    const openAddModal = () => {
        setEditingUser(null);
        setIsAddModalOpen(true);
        setError('');
    };
    
    const openEditModal = (member) => {
        setIsAddModalOpen(false);
        setEditingUser(member);
        setError('');
    };
    
    const closeModal = () => {
        setEditingUser(null);
        setIsAddModalOpen(false);
        setError('');
    };

    const filteredMembers = members.filter(member => 
        member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading && members.length === 0) return <div className="loading">טוען מתאמנים...</div>;

    return (
        <div className="trainers-view-container">
            <div className="view-header">
                <h3>רשימת מתאמנים ({members.length})</h3>
                <input 
                    type="text"
                    placeholder="חפש לפי שם או אימייל..."
                    className="search-input"
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
                <button className="btn btn-primary" onClick={openAddModal}>
                    + הוסף מתאמן
                </button>
            </div>
            
            {error && <p className="error">{error}</p>}

            <div className="trainers-grid">
                {filteredMembers.map(member => (
                    <div key={member.id} className="trainer-card">
                        <h4>{member.full_name}</h4>
                        <p>{member.email}</p>
                        <p>{member.phone}</p>
                        <div className="card-actions">
                            <button className="btn btn-secondary" onClick={() => openEditModal(member)}>
                                ערוך
                            </button>
                            <button 
                                className="btn btn-danger" 
                                onClick={() => handleDelete(member)} // 5. קריאה לפונקציה החדשה
                                disabled={isLoading}
                            >
                                מחק
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {(isAddModalOpen || editingUser) && (
                <UserModal 
                    user={editingUser}
                    defaultRole="member"
                    onClose={closeModal}
                    onSave={handleSave}
                />
            )}

            {/* 6. הוספת המודל החדש לדף */}
            <ConfirmModal
                isOpen={confirmState.isOpen}
                title={confirmState.title}
                message={confirmState.message}
                onConfirm={confirmState.onConfirm}
                onCancel={() => setConfirmState({ isOpen: false })}
                confirmText={confirmState.confirmText || 'אישור'}
                cancelText={confirmState.cancelText || 'ביטול'}
                confirmButtonType={confirmState.confirmButtonType || 'btn-primary'}
            />

            <button className="fab" onClick={openAddModal}>+</button>
        </div>
    );
}

export default MembersView;