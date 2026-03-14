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
  marginBottom: '16px',
  fontSize: '14px',
  color: 'var(--text-secondary)',
};

export default FormField;

export const inputStyle = {
  marginTop: '6px',
  padding: '10px',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  color: 'var(--text-heading)',
  fontSize: '14px',
  outline: 'none',
};

export const textareaStyle = {
  ...inputStyle,
  fontFamily: 'inherit',
  resize: 'vertical',
};
