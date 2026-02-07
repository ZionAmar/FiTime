import React, { useRef, useEffect } from 'react';
import '../App.css';

const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({ isOpen, onClose, children }) {
  const contentRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !contentRef.current) return;

      const focusable = contentRef.current.querySelectorAll(FOCUSABLE_SELECTOR);
      const list = Array.from(focusable).filter((el) => el.offsetParent !== null);
      if (list.length === 0) return;

      const first = list[0];
      const last = list[list.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeydown);

    const timer = requestAnimationFrame(() => {
      if (contentRef.current) {
        const focusable = contentRef.current.querySelector(FOCUSABLE_SELECTOR);
        if (focusable) focusable.focus();
      }
    });

    return () => {
      document.removeEventListener('keydown', handleKeydown);
      cancelAnimationFrame(timer);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        ref={contentRef}
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="סגור">
          ×
        </button>
        {children}
      </div>
    </div>
  );
}
