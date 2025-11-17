import React, { useState, useEffect } from 'react';
import api from '../services/api';
import UserModal from '../components/UserModal';
import ConfirmModal from '../components/ConfirmModal';
import '../styles/CardGridView.css'; // ודא שהקובץ מיובא

function TrainersView() {
    const [trainers, setTrainers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingUser, setEditingUser] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [confirmState, setConfirmState] = useState({ isOpen: false });

    const closeConfirmModal = () => {
        setConfirmState({ isOpen: false });
        setError('');
    };

    const fetchTrainers = async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await api.get('/api/users/all?role=trainer');
            setTrainers(data);
        } catch (err) {
            setError(err.message || 'שגיאה בטעינת המאמנים');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTrainers();
    }, []);
    
    const handleSave = () => {
        setEditingUser(null);
        setIsAddModalOpen(false);
        fetchTrainers();
    };

    const performDelete = async (userId) => {
        closeConfirmModal();
        setIsLoading(true);
        setError('');
        try {
            await api.delete(`/api/users/${userId}`);
            fetchTrainers();
        } catch (err) {
            setError(err.message || 'שגיאה במחיקת המאמן.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = (userId, userName) => {
        setError('');
        setConfirmState({
            isOpen: true,
            title: 'אישור מחיקת מאמן',
            message: `האם אתה בטוח שברצונך למחוק את ${userName}? פעולה זו תסיר את המשתמש מהסטודיו.`,
            onConfirm: () => performDelete(userId),
            confirmText: 'כן, מחק',
            confirmButtonType: 'btn-danger'
        });
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

    const openEditModal = (trainer) => {
        setIsAddModalOpen(false);
        setEditingUser(trainer);
        setError('');
    };

    const closeModal = () => {
        setEditingUser(null);
        setIsAddModalOpen(false);
        setError('');
        closeConfirmModal();
    };

    const filteredTrainers = trainers.filter(trainer => 
        trainer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainer.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading && trainers.length === 0) return <div className="loading">טוען מאמנים...</div>;

    return (
        // FIX: שינוי שמות הקלאסים
        <div className="card-grid-container">
            <div className="view-header">
                <h3>צוות המאמנים ({trainers.length})</h3>
                <input 
                    type="text"
                    placeholder="חפש לפי שם או אימייל..."
                    className="search-input"
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
                <button className="btn btn-primary" onClick={openAddModal}>
                    + הוסף מאמן
                </button>
            </div>
            
            {error && <p className="error">{error}</p>}
            
            <div className="card-grid">
                {filteredTrainers.map(trainer => (
                    <div key={trainer.id} className="info-card">
                        <h4>{trainer.full_name}</h4>
                        <p>{trainer.email}</p>
                        <p>{trainer.phone}</p>
                        <div className="card-actions">
                            <button className="btn btn-secondary" onClick={() => openEditModal(trainer)}>
                                ערוך
                            </button>
                            <button 
                                className="btn btn-danger" 
                                onClick={() => handleDelete(trainer.id, trainer.full_name)}
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
                    defaultRole="trainer"
                    onClose={closeModal}
                    onSave={handleSave}
                />
            )}

            <button className="fab" onClick={openAddModal}>+</button>

            <ConfirmModal
                isOpen={confirmState.isOpen}
                title={confirmState.title}
                message={confirmState.message}
                onConfirm={confirmState.onConfirm}
                onCancel={closeConfirmModal}
                confirmText={confirmState.confirmText}
                cancelText="ביטול"
                confirmButtonType={confirmState.confirmButtonType}
            />
        </div>
    );
}

export default TrainersView;