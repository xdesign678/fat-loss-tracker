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
  padding: '8px 16px',
  background: 'transparent',
  border: '1px solid var(--border)',
  borderRadius: '7.5px',
  color: 'var(--text-primary)',
  fontSize: 'var(--text-base)',
  fontWeight: '400',
  cursor: 'pointer',
  transition: 'background 200ms ease',
};

const confirmButtonStyle = {
  flex: 1,
  padding: '8px 16px',
  background: 'var(--btn-primary-bg)',
  border: 'none',
  borderRadius: '7.5px',
  color: 'var(--btn-primary-text)',
  fontSize: 'var(--text-base)',
  fontWeight: '400',
  cursor: 'pointer',
  transition: 'all 200ms ease',
};

export default ModalActions;
