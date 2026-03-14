import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function ModalShell({
  isOpen,
  onClose,
  title,
  children,
  footer = null,
  maxWidth = '520px',
  bodyPadding = '20px 24px 24px',
  contentStyle = {},
}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={styles.overlay} onClick={onClose}>
      <div
        className="modal-content"
        style={{ ...styles.content, maxWidth, ...contentStyle }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div style={styles.header}>
          <h2 style={styles.title}>{title}</h2>
          <button type="button" style={styles.closeBtn} onClick={onClose} aria-label={`关闭${title}`}>
            <X size={20} />
          </button>
        </div>
        <div style={{ ...styles.body, padding: bodyPadding }}>
          {children}
        </div>
        {footer && <div style={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
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
  },
  content: {
    background: 'var(--bg-tertiary)',
    borderRadius: '16px',
    width: '100%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px 0',
    gap: '12px',
  },
  title: {
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--text-heading)',
    margin: 0,
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: '12px',
    minWidth: '44px',
    minHeight: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    overflowY: 'auto',
    flex: 1,
  },
  footer: {
    display: 'flex',
    gap: '12px',
    padding: '0 24px 24px',
  },
};
