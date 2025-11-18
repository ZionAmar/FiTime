import React, { useState, useEffect } from 'react';
import api from '../services/api'; 
import ConfirmModal from './ConfirmModal';
// ודא שאתה מייבא את קובץ העיצוב המתאים (אם יש לך קובץ ספציפי או משתמש בגלובלי)
// import '../styles/TrainersView.css'; // משתמש באותו עיצוב בסיס

function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    
    // 1. הוספת state לחיפוש
    const [searchTerm, setSearchTerm] = useState('');

    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        visit_limit: '',
        duration_days: '',
        is_active: 1
    });

    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        confirmText: '',
        cancelText: '',
        confirmButtonType: ''
    });

    const fetchProducts = async () => {
        try {
            setIsLoading(true);
            const data = await api.get('/api/products');
            setProducts(data);
            setError('');
        } catch (err) {
            setError(err.message || 'שגיאה בטעינת המנויים');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const closeConfirmModal = () => {
        setConfirmState({ isOpen: false });
    };

    // 2. פונקציה לטיפול בשינוי בתיבת החיפוש
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleAddNew = () => {
        setIsEditing(false);
        setCurrentProduct(null);
        setFormData({
            name: '',
            description: '',
            price: '',
            visit_limit: '',
            duration_days: '',
            is_active: 1
        });
        setShowForm(true);
    };

    const handleEdit = (product) => {
        setIsEditing(true);
        setCurrentProduct(product);
        setFormData({
            name: product.name,
            description: product.description || '',
            price: product.price,
            visit_limit: product.visit_limit || '',
            duration_days: product.duration_days || '',
            is_active: product.is_active
        });
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setError('');
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const dataToSend = {
            ...formData,
            visit_limit: formData.visit_limit ? parseInt(formData.visit_limit) : null,
            duration_days: formData.duration_days ? parseInt(formData.duration_days) : null,
            price: parseFloat(formData.price)
        };

        try {
            if (isEditing) {
                await api.put(`/api/products/${currentProduct.id}`, dataToSend);
            } else {
                await api.post('/api/products', dataToSend);
            }
            
            setShowForm(false);
            await fetchProducts(); 

        } catch (err) {
            setError(err.response?.data?.message || err.message || 'שגיאה בשמירת המנוי');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = (product) => {
        setError('');
        setConfirmState({
            isOpen: true,
            title: 'אישור השבתת מנוי',
            message: `האם אתה בטוח שברצונך להשבית את "${product.name}"? לא יהיה ניתן לשייך אותו יותר למתאמנים חדשים.`,
            onConfirm: () => performDelete(product.id),
            confirmText: 'כן, השבת',
            confirmButtonType: 'btn-danger'
        });
    };

    const performDelete = async (productId) => {
        closeConfirmModal();
        setIsLoading(true);
        setError('');
        try {
            await api.delete(`/api/products/${productId}`);
            await fetchProducts(); 
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'שגיאה בהשבתת המנוי');
        } finally {
            setIsLoading(false);
        }
    };

    // 3. סינון המוצרים לפי הטקסט
    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="trainers-view-container"> 
            <div className="view-header">
                <h3>ניהול מנויים וכרטיסיות ({filteredProducts.length})</h3>
                
                {/* 4. שורת החיפוש - מופיעה רק כשהטופס סגור */}
                {!showForm && (
                    <div className="header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input 
                            type="text"
                            placeholder="חפש מנוי..."
                            className="search-input"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            style={{ maxWidth: '200px' }} // הגבלת רוחב כדי לא לשבור את העיצוב
                        />
                        <button 
                            className="btn btn-primary" 
                            onClick={handleAddNew}
                        >
                            + הוסף מנוי
                        </button>
                    </div>
                )}
            </div>

            {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}

            {showForm ? (
                <form onSubmit={handleSubmit} className="product-form" style={{ maxWidth: '500px', margin: '20px auto', display: 'flex', flexDirection: 'column', gap: '15px', background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                    <h2 style={{marginBottom: '1rem', textAlign: 'center', color: 'var(--dark-color)'}}>
                        {isEditing ? 'עריכת מנוי' : 'יצירת מנוי חדש'}
                    </h2>
                    
                    <div className="form-field">
                        <label htmlFor="name">שם המנוי/כרטיסייה*</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    
                    <div className="form-field">
                        <label htmlFor="description">תיאור (אופציונלי)</label>
                        <textarea id="description" name="description" value={formData.description} onChange={handleChange}></textarea>
                    </div>

                    <div className="form-field">
                        <label htmlFor="price">מחיר (בש"ח)*</label>
                        <input type="number" id="price" name="price" value={formData.price} onChange={handleChange} required min="0" step="0.01" />
                    </div>

                    <div className="form-field">
                        <label htmlFor="visit_limit">מגבלת כניסות (כרטיסייה)</label>
                        <input type="number" id="visit_limit" name="visit_limit" value={formData.visit_limit} onChange={handleChange} placeholder="השאר ריק למנוי ללא הגבלה" min="1" />
                    </div>

                    <div className="form-field">
                        <label htmlFor="duration_days">תוקף (בימים)</label>
                        <input type="number" id="duration_days" name="duration_days" value={formData.duration_days} onChange={handleChange} placeholder="השאר ריק למנוי ללא הגבלת זמן" min="1" />
                    </div>

                     <div className="form-field">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                            <input type="checkbox" name="is_active" checked={formData.is_active === 1} onChange={handleChange} style={{ width: 'auto' }} />
                            המנוי פעיל וזמין לרכישה
                        </label>
                    </div>

                    <div className="form-actions" style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end' }}>
                         <button type="button" className="btn btn-secondary" onClick={handleCancel} disabled={isLoading}>
                            ביטול
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                            {isLoading ? 'שומר...' : (isEditing ? 'שמור שינויים' : 'צור מנוי')}
                        </button>
                    </div>
                </form>
            ) : (
                <>
                    {isLoading && <p>טוען...</p>}
                    {!isLoading && (
                        <div className="trainers-grid"> {/* שימוש באותו גריד כמו של המאמנים */}
                             {filteredProducts.map(product => (
                                <div key={product.id} className="trainer-card">
                                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                                        <h4>{product.name}</h4>
                                        <span className={`status-badge ${product.is_active ? 'active' : 'canceled'}`}>
                                            {product.is_active ? 'פעיל' : 'לא פעיל'}
                                        </span>
                                    </div>
                                    
                                    <div style={{margin: '10px 0', fontSize: '0.95rem', lineHeight: '1.6'}}>
                                        <p><strong>מחיר:</strong> ₪{product.price}</p>
                                        <p><strong>כניסות:</strong> {product.visit_limit ? product.visit_limit : '∞'}</p>
                                        <p><strong>תוקף:</strong> {product.duration_days ? `${product.duration_days} ימים` : '∞'}</p>
                                    </div>
                                    
                                    {product.description && (
                                        <p style={{fontSize: '0.85rem', fontStyle: 'italic', marginTop: '5px', opacity: 0.7, minHeight: '1.5em'}}>
                                            {product.description}
                                        </p>
                                    )}

                                    <div className="card-actions">
                                        <button className="btn btn-secondary" onClick={() => handleEdit(product)} disabled={isLoading}>ערוך</button>
                                        {product.is_active && (
                                            <button className="btn btn-danger" onClick={() => handleDelete(product)} disabled={isLoading}>השבת</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {!isLoading && filteredProducts.length === 0 && !showForm && (
                        <div className="empty-state" style={{textAlign: 'center', padding: '3rem'}}>
                            <p>{searchTerm ? 'לא נמצאו מנויים תואמים.' : 'עדיין לא יצרת מנויים או כרטיסיות.'}</p>
                            {!searchTerm && <button className="btn btn-primary" onClick={handleAddNew} style={{marginTop: '10px'}}>צור מנוי ראשון</button>}
                        </div>
                    )}
                </>
            )}

            <ConfirmModal
                isOpen={confirmState.isOpen}
                title={confirmState.title}
                message={confirmState.message}
                onConfirm={confirmState.onConfirm}
                onCancel={closeConfirmModal}
                confirmText={confirmState.confirmText || 'אישור'}
                cancelText="ביטול"
                confirmButtonType={confirmState.confirmButtonType || 'btn-primary'}
            />
            
             {/* כפתור צף למובייל - מופיע רק כשהטופס סגור */}
            {!showForm && (
                <button className="fab" onClick={handleAddNew}>+</button>
            )}
        </div>
    );
}

export default AdminProducts;