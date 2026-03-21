import { memo } from 'react';
import { ClipboardList } from 'lucide-react';

export default memo(function EmptyState({
  icon: Icon = ClipboardList,
  title = '暂无记录',
  description = '',
  actionLabel = '',
  onAction = null,
}) {
  return (
    <div style={styles.container}>
      <div style={styles.iconWrap}>
        <Icon size={40} color="var(--text-muted)" strokeWidth={1.2} />
      </div>
      <p style={styles.title}>{title}</p>
      {description && <p style={styles.desc}>{description}</p>}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="btn-interactive"
          style={styles.btn}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
});

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-2xl) var(--space-xl)',
    gap: 'var(--space-md)',
    animation: 'scaleIn var(--duration-slow) ease',
  },
  iconWrap: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    background: 'var(--bg-tertiary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 'var(--space-sm)',
  },
  title: {
    fontSize: 'var(--text-md)',
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
  desc: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-muted)',
    textAlign: 'center',
    maxWidth: '260px',
    lineHeight: 1.5,
  },
  btn: {
    marginTop: 'var(--space-sm)',
    padding: '8px 24px',
    borderRadius: '7.5px',
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-base)',
    fontWeight: 400,
    cursor: 'pointer',
    transition: 'background 200ms ease',
  },
};
