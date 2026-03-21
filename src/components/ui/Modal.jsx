import { useEffect, useCallback, useRef } from 'react';

const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

const Modal = ({ isOpen, onClose, title, children, maxWidth = '500px' }) => {
  const previousFocusRef = useRef(null);
  const dialogRef = useRef(null);

  const handleEscape = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  // Focus trap: keep Tab within modal
  const handleTab = useCallback((e) => {
    if (e.key !== 'Tab' || !dialogRef.current) return;
    const focusable = dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.top = `-${scrollY}px`;
      previousFocusRef.current = document.activeElement;
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('keydown', handleTab);
      document.body.classList.add('modal-open');
      // Auto-focus first focusable element
      setTimeout(() => {
        const focusable = dialogRef.current?.querySelectorAll(FOCUSABLE_SELECTOR);
        if (focusable?.length) focusable[0].focus();
      }, 50);

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.removeEventListener('keydown', handleTab);
        document.body.classList.remove('modal-open');
        document.body.style.top = '';
        window.scrollTo(0, scrollY);
        // Restore focus on close
        if (previousFocusRef.current?.focus) {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [isOpen, handleEscape, handleTab]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={overlayStyle} onClick={onClose}>
      <div
        ref={dialogRef}
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
  padding: 'var(--space-lg)',
};

const modalStyle = {
  background: 'var(--bg-secondary)',
  borderRadius: 'var(--radius-xl)',
  padding: 'var(--space-xl)',
  width: '100%',
  maxHeight: '90vh',
  overflow: 'auto',
  boxShadow: 'var(--shadow-modal)',
  overscrollBehavior: 'contain',
  WebkitOverflowScrolling: 'touch',
};

const titleStyle = {
  fontSize: 'var(--text-2xl)',
  fontWeight: '700',
  color: 'var(--text-heading)',
  margin: '0 0 var(--space-lg) 0',
};

export default Modal;
