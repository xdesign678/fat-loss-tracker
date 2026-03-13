import { ClipboardList } from 'lucide-react';

export default function EmptyState({
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
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    gap: '12px',
    animation: 'scaleIn 0.3s ease',
  },
  iconWrap: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    background: 'var(--bg-tertiary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8px',
  },
  title: {
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
  desc: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    textAlign: 'center',
    maxWidth: '260px',
    lineHeight: 1.5,
  },
  btn: {
    marginTop: '8px',
    padding: '10px 24px',
    borderRadius: '10px',
    border: '1px solid var(--accent-border)',
    background: 'var(--accent-bg)',
    color: 'var(--accent)',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
