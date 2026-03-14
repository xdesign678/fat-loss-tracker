import { memo } from 'react';

const QuickValueButtons = memo(({ values, onSelect, unit = '', selectedValue }) => {
  return (
    <div style={containerStyle}>
      {values.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onSelect(v)}
          style={{
            ...buttonStyle,
            ...(selectedValue === v ? activeStyle : {}),
          }}
          className="btn-interactive"
        >
          {v}{unit}
        </button>
      ))}
    </div>
  );
});

QuickValueButtons.displayName = 'QuickValueButtons';

const containerStyle = {
  display: 'flex',
  gap: '8px',
};

const buttonStyle = {
  padding: '8px 12px',
  background: 'var(--bg-tertiary)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  color: 'var(--text-heading)',
  fontSize: '13px',
  fontWeight: '500',
  cursor: 'pointer',
  minWidth: '44px',
  minHeight: '44px',
  whiteSpace: 'nowrap',
};

const activeStyle = {
  borderColor: 'var(--accent)',
  background: 'var(--accent-bg)',
  color: 'var(--accent)',
};

export default QuickValueButtons;
