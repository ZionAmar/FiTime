import React, { useState, useEffect } from 'react';
import api from '../services/api'; 
import ConfirmModal from './ConfirmModal';
import '../styles/AdminProducts.css';

function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

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
        onConfirm: () => {}
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
        setConfirmState({ isOpen: false });
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

    return (
        <div className="products-view-container"> 
            <div className="view-header">
                <h3>ניהול מנויים וכרטיסיות ({products.length})</h3>
                <button 
                    className="btn btn-primary" 
                    onClick={handleAddNew}
                    disabled={showForm} 
                >
                    + הוסף מנוי/כרטיסייה
                </button>
            </div>

            {error && <p className="error-message">{error}</p>}

            {showForm ? (
                <form onSubmit={handleSubmit} className="product-form">
                    <h2>{isEditing ? 'עריכת מנוי' : 'מנוי/כרטיסייה חדשים'}</h2>
                    
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
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input type="checkbox" name="is_active" checked={formData.is_active === 1} onChange={handleChange} />
                            המנוי פעיל וזמין לרכישה
                        </label>
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                            {isLoading ? 'שומר...' : (isEditing ? 'שמור שינויים' : 'צור מנוי')}
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={handleCancel} disabled={isLoading}>
                            ביטול
                        </button>
                    </div>
                </form>
            ) : (
                <>
                    {isLoading && <div className="loading">טוען...</div>}
                    {!isLoading && (
                        <div className="admin-table-container"> 
                            <table className="admin-table" border={1}>
                                <thead>
                                    <tr>
                                        <th>שם המנוי/כרטיסייה</th>
                                        <th>מחיר</th>
                                        <th>כניסות</th>
                                        <th>תוקף (ימים)</th>
                                        <th>סטטוס</th>
                                        <th>פעולות</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map(product => (
                                        <tr key={product.id}>
                                            <td data-label="שם">{product.name}</td>
                                            <td data-label="מחיר">₪{product.price}</td>
                                            <td data-label="כניסות">{product.visit_limit || 'ללא הגבלה'}</td>
                                            <td data-label="תוקף">{product.duration_days || 'ללא הגבלה'}</td>
                                            <td data-label="סטטוס">{product.is_active ? 'פעיל' : 'לא פעיל'}</td>
                                            <td data-label="פעולות" className='actions-cell'>
                                                <button className="btn btn-secondary btn-small" onClick={() => handleEdit(product)} disabled={isLoading}>ערוך</button>
                                                {product.is_active && (
                                                    <button className="btn btn-danger btn-small" onClick={() => handleDelete(product)} disabled={isLoading}>השבת</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

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
        </div>
    );
}

export default AdminProducts;