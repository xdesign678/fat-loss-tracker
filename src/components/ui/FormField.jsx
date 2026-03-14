import { memo } from 'react';

const FormField = memo(({ label, required, children }) => {
  return (
    <label style={labelStyle}>
      <span>{label}{required && '*'}</span>
      {children}
    </label>
  );
});

FormField.displayName = 'FormField';

const labelStyle = {
  display: 'flex',
  flexDirection: 'column',
  marginBottom: 'var(--space-base)',
  fontSize: 'var(--text-base)',
  color: 'var(--text-secondary)',
};

export default FormField;

export const inputStyle = {
  marginTop: 'var(--space-sm)',
  padding: 'var(--space-md)',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-base)',
  color: 'var(--text-heading)',
  fontSize: 'var(--text-base)',
  outline: 'none',
};

export const textareaStyle = {
  ...inputStyle,
  fontFamily: 'inherit',
  resize: 'vertical',
};
