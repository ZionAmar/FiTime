import React, { useState, useEffect } from 'react';
import api from '../services/api';
import RoomModal from '../components/RoomModal';
import ConfirmModal from '../components/ConfirmModal';
import '../styles/CardGridView.css'; 

function RoomsView() {
    const [rooms, setRooms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingRoom, setEditingRoom] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {}
    });

    const fetchRooms = async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await api.get('/api/rooms');
            setRooms(data);
        } catch (err) {
            setError(err.message || 'שגיאה בטעינת החדרים');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms();
    }, []);
    
    const handleSave = () => {
        setEditingRoom(null);
        setIsAddModalOpen(false);
        fetchRooms(); 
    };

    const handleDeleteClick = (room) => {
        setError('');
        setConfirmState({
            isOpen: true,
            title: 'אישור מחיקת חדר',
            message: `האם אתה בטוח שברצונך למחוק את החדר "${room.name}"? פעולה זו היא סופית ועלולה להשפיע על שיעורים קיימים.`,
            onConfirm: () => performDelete(room.id),
            confirmText: 'כן, מחק חדר',
            confirmButtonType: 'btn-danger'
        });
    };

    const performDelete = async (roomId) => {
        setConfirmState({ isOpen: false });
        setError('');
        setIsLoading(true);
        try {
            await api.delete(`/api/rooms/${roomId}`);
            fetchRooms();
        } catch (err) {
            setError(err.message || 'שגיאה במחיקת החדר.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setError('');
    };

    const openAddModal = () => {
        setEditingRoom(null);
        setIsAddModalOpen(true);
        setError('');
    };

    const openEditModal = (room) => {
        setIsAddModalOpen(false);
        setEditingRoom(room);
        setError('');
    };

    const closeConfirmModal = () => {
        setConfirmState({ isOpen: false });
    };

    const closeModal = () => {
        setEditingRoom(null);
        setIsAddModalOpen(false);
        setError('');
    };

    const filteredRooms = rooms.filter(room => 
        room.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading && rooms.length === 0) return <div className="loading">טוען חדרים...</div>;

    return (
        <>
            {/* FIX: שינוי שמות הקלאסים */}
            <div className="card-grid-container">
                <div className="view-header">
                    <h3>רשימת חדרים ({rooms.length})</h3>
                    
                    <input 
                        type="text"
                        placeholder="חפש לפי שם חדר..."
                        className="search-input"
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />

                    <button className="btn btn-primary" onClick={openAddModal}>
                        + הוסף חדר
                    </button>
                </div>
                
                {error && <p className="error">{error}</p>}

                <div className="card-grid">
                    {filteredRooms.map(room => (
                        <div key={room.id} className="info-card">
                            <h4>{room.name}</h4>
                            <p>קיבולת: {room.capacity} אנשים</p>
                            <p>{room.has_equipment ? 'כולל ציוד' : 'ללא ציוד'}</p>
                            <div className="card-actions">
                                <button className="btn btn-secondary" onClick={() => openEditModal(room)}>ערוך</button>
                                <button 
                                    className="btn btn-danger" 
                                    onClick={() => handleDeleteClick(room)}
                                    disabled={isLoading}
                                >
                                    מחק
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {(isAddModalOpen || editingRoom) && (
                    <RoomModal 
                        room={editingRoom}
                        onClose={closeModal}
                        onSave={handleSave}
                    />
                )}

                <button className="fab" onClick={openAddModal}>+</button>
            </div>

            <ConfirmModal
                isOpen={confirmState.isOpen}
                title={confirmState.title}
                message={confirmState.message}
                onConfirm={confirmState.onConfirm}
                onCancel={closeConfirmModal}
                confirmText={confirmState.confirmText || 'אישור'}
                cancelText="ביטול"
                confirmButtonType={confirmState.confirmButtonType || 'btn-danger'}
            />
        </>
    );
}

export default RoomsView;