import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '../utils/calculations';
import { shiftDate } from '../utils/tracking';

const DateNavigator = ({ selectedDate, onChange }) => {
  const today = formatDate(new Date());
  const isToday = selectedDate === today;

  return (
    <div style={styles.container}>
      <button
        type="button"
        onClick={() => onChange(shiftDate(selectedDate, -1))}
        style={styles.arrowButton}
        aria-label="查看前一天"
      >
        <ChevronLeft size={18} />
      </button>

      <div style={styles.center}>
        <div style={styles.label}>{isToday ? '今天' : formatDate(selectedDate, 'MM月DD日')}</div>
        {!isToday && (
          <button
            type="button"
            onClick={() => onChange(today)}
            style={styles.todayButton}
          >
            回到今天
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => onChange(shiftDate(selectedDate, 1))}
        style={styles.arrowButton}
        aria-label="查看后一天"
        disabled={selectedDate >= today}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    padding: '10px 12px',
    marginBottom: '20px',
  },
  arrowButton: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    border: 'none',
    background: 'var(--bg-secondary)',
    color: 'var(--text-heading)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  center: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },
  label: {
    fontSize: '15px',
    fontWeight: '600',
    color: 'var(--text-heading)',
  },
  todayButton: {
    border: 'none',
    background: 'var(--accent-bg)',
    color: 'var(--accent)',
    borderRadius: '999px',
    padding: '5px 10px',
    fontSize: '12px',
    cursor: 'pointer',
  },
};

export default DateNavigator;
