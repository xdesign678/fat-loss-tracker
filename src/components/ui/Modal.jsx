import { useEffect, useCallback } from 'react';

const Modal = ({ isOpen, onClose, title, children, maxWidth = '500px' }) => {
  const handleEscape = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.classList.add('modal-open');
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.classList.remove('modal-open');
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={overlayStyle} onClick={onClose}>
      <div
        className="modal-content"
        style={{ ...modalStyle, maxWidth }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {title && <h3 style={titleStyle}>{title}</h3>}
        {children}
      </div>
    </div>
  );
};

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'var(--bg-overlay)',
  backdropFilter: 'blur(10px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '20px',
};

const modalStyle = {
  background: 'var(--bg-tertiary)',
  borderRadius: '16px',
  padding: '24px',
  width: '100%',
  maxHeight: '90vh',
  overflow: 'auto',
  boxShadow: 'var(--shadow-modal)',
};

const titleStyle = {
  fontSize: '18px',
  fontWeight: '600',
  color: 'var(--text-heading)',
  margin: '0 0 20px 0',
};

export default Modal;
