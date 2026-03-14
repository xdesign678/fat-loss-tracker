import { memo } from 'react';

const ModalActions = memo(({ onCancel, onConfirm, cancelText = '取消', confirmText = '确认', confirmDisabled = false, confirmStyle = {} }) => {
  return (
    <div style={containerStyle}>
      <button type="button" onClick={onCancel} style={cancelButtonStyle}>
        {cancelText}
      </button>
      <button
        type="button"
        onClick={onConfirm}
        style={{ ...confirmButtonStyle, ...confirmStyle }}
        disabled={confirmDisabled}
      >
        {confirmText}
      </button>
    </div>
  );
});

ModalActions.displayName = 'ModalActions';

const containerStyle = {
  display: 'flex',
  gap: 'var(--space-md)',
  marginTop: 'var(--space-lg)',
};

const cancelButtonStyle = {
  flex: 1,
  padding: 'var(--space-md)',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-base)',
  color: 'var(--text-heading)',
  fontSize: 'var(--text-base)',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'background var(--duration-base)',
};

const confirmButtonStyle = {
  flex: 1,
  padding: 'var(--space-md)',
  background: 'var(--accent)',
  border: 'none',
  borderRadius: 'var(--radius-base)',
  color: '#fff',
  fontSize: 'var(--text-base)',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'background var(--duration-base)',
};

export default ModalActions;
