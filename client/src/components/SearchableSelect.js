import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import '../styles/SearchableSelect.css';

function SearchableSelect({ options, value, onChange, placeholder = "בחר..." }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef(null);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

    const calculatePosition = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY + 5, // מיקום אבסולוטי בדף
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    useEffect(() => {
        const handleResizeOrScroll = () => {
            if (isOpen) calculatePosition();
        };
        
        const handleClickOutside = (event) => {
            if (containerRef.current && containerRef.current.contains(event.target)) {
                return;
            }
            const portalEl = document.getElementById('searchable-select-portal');
            if (portalEl && portalEl.contains(event.target)) {
                return;
            }
            setIsOpen(false);
        };

        if (isOpen) {
            calculatePosition();
            window.addEventListener('resize', handleResizeOrScroll);
            window.addEventListener('scroll', handleResizeOrScroll, true);
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            window.removeEventListener('resize', handleResizeOrScroll);
            window.removeEventListener('scroll', handleResizeOrScroll, true);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleSelect = (val) => {
        onChange(val);
        setIsOpen(false);
        setSearchTerm('');
    };

    const selectedOption = options.find(opt => opt.value == value);
    const filteredOptions = options.filter(opt => 
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const dropdownStyles = {
        position: 'absolute',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        width: `${coords.width}px`,
        backgroundColor: '#ffffff', 
        border: '1px solid #ccc',
        borderRadius: '8px',
        boxShadow: '0 5px 20px rgba(0,0,0,0.3)', 
        zIndex: 99999, 
        maxHeight: '250px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: 'inherit'
    };

    const portalContent = (
        <div id="searchable-select-portal" style={dropdownStyles}>
            <div style={{ padding: '10px', borderBottom: '1px solid #eee', background: '#fff' }}>
                <input
                    type="text"
                    placeholder="חפש..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                    style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        boxSizing: 'border-box',
                        fontSize: '1rem'
                    }}
                />
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, overflowY: 'auto', background: '#fff', maxHeight: '200px' }}>
                {filteredOptions.length > 0 ? (
                    filteredOptions.map(option => (
                        <li
                            key={option.value}
                            onClick={() => handleSelect(option.value)}
                            style={{
                                padding: '10px 15px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #f9f9f9',
                                color: '#333',
                                backgroundColor: option.value == value ? '#e6f7ff' : '#fff',
                                fontWeight: option.value == value ? 'bold' : 'normal'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = option.value == value ? '#e6f7ff' : '#fff'}
                        >
                            {option.label}
                        </li>
                    ))
                ) : (
                    <li style={{ padding: '15px', textAlign: 'center', color: '#999' }}>
                        לא נמצאו תוצאות
                    </li>
                )}
            </ul>
        </div>
    );

    return (
        <div className="searchable-select-container" ref={containerRef} style={{ width: '100%' }}>
            <div 
                className={`searchable-select-trigger ${isOpen ? 'open' : ''}`} 
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 15px',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    userSelect: 'none'
                }}
            >
                <span>{selectedOption ? selectedOption.label : placeholder}</span>
                <span style={{ fontSize: '0.8rem', color: '#666' }}>▼</span>
            </div>

            {isOpen && ReactDOM.createPortal(portalContent, document.body)}
        </div>
    );
}

export default SearchableSelect;