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
  gap: '12px',
  marginTop: '20px',
};

const cancelButtonStyle = {
  flex: 1,
  padding: '12px',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  color: 'var(--text-heading)',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'background 0.3s',
};

const confirmButtonStyle = {
  flex: 1,
  padding: '12px',
  background: 'var(--accent)',
  border: 'none',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'background 0.3s',
};

export default ModalActions;
