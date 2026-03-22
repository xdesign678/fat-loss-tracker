import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  calculateBMR,
  calculateTDEE,
  calculateDailyCalorieTarget,
  getWeeklyCalorieData,
  formatDate,
} from '../utils/calculations';
import { CalendarDays, TrendingDown, TrendingUp } from 'lucide-react';

const WeeklyCalorieProgress = ({ selectedDate, onDateChange }) => {
  const { state } = useApp();
  const profile = state.profile || {};

  const dailyTarget = useMemo(() => {
    const bmr =
      profile.height && profile.age && profile.currentWeight
        ? calculateBMR(profile.currentWeight, profile.height, profile.age, profile.sex)
        : 0;
    const tdee = bmr && profile.activityLevel ? calculateTDEE(bmr, profile.activityLevel) : 0;
    return tdee ? calculateDailyCalorieTarget(tdee, 0.5) : 0;
  }, [profile.currentWeight, profile.height, profile.age, profile.activityLevel, profile.sex]);

  const weekData = useMemo(
    () => getWeeklyCalorieData(state.dailyLogs, dailyTarget, selectedDate),
    [state.dailyLogs, dailyTarget, selectedDate],
  );

  if (!dailyTarget) return null;

  const progressPct = Math.min(weekData.progressPercent, 100);
  const isOverBudget = weekData.totalConsumed > weekData.weeklyBudget;

  const getBlockColor = (day) => {
    if (day.status === 'future') return 'var(--border)';
    if (day.status === 'over') return 'var(--danger)';
    if (day.status === 'warning') return 'var(--warning)';
    return 'var(--success)';
  };

  const getBlockFillHeight = (day) => {
    if (day.calories === null || !dailyTarget) return '0%';
    const ratio = Math.min(day.calories / dailyTarget, 1.3);
    return `${Math.round((ratio / 1.3) * 100)}%`;
  };

  return (
    <div style={styles.card} className="card-hover">
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <CalendarDays size={18} style={{ color: 'var(--accent)' }} />
          <span style={styles.title}>本周热量预算</span>
        </div>
        <span style={{ ...styles.percent, color: isOverBudget ? 'var(--danger)' : 'var(--accent)' }}>
          {weekData.progressPercent}%
        </span>
      </div>

      {/* Progress bar */}
      <div style={styles.progressTrack}>
        <div
          style={{
            ...styles.progressFill,
            width: `${progressPct}%`,
            background: isOverBudget ? 'var(--danger)' : 'var(--accent)',
          }}
        />
      </div>
      <div style={styles.budgetText}>
        {weekData.totalConsumed.toLocaleString()} / {weekData.weeklyBudget.toLocaleString()} kcal
      </div>

      {/* Day blocks */}
      <div style={styles.daysRow}>
        {weekData.days.map((day) => (
          <button
            key={day.date}
            type="button"
            style={styles.dayCol}
            onClick={() => onDateChange(day.date)}
            className="btn-interactive"
            aria-label={`${day.dayLabel} ${day.calories !== null ? day.calories + ' kcal' : '未记录'}`}
          >
            <span style={styles.dayLabel}>{day.dayLabel}</span>
            <div
              style={{
                ...styles.block,
                ...(day.isToday ? styles.blockToday : {}),
              }}
            >
              <div
                style={{
                  ...styles.blockFill,
                  height: getBlockFillHeight(day),
                  background: getBlockColor(day),
                }}
              />
            </div>
            <span style={styles.dayCalories}>
              {day.calories !== null ? day.calories : '--'}
            </span>
            {day.vsBudgetAvg && (
              <span style={styles.arrow}>
                {day.vsBudgetAvg === 'above' ? (
                  <TrendingUp size={12} style={{ color: 'var(--danger)' }} />
                ) : (
                  <TrendingDown size={12} style={{ color: 'var(--success)' }} />
                )}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Remaining average */}
      {weekData.remainingAvg > 0 && (
        <div style={styles.avgRow}>
          剩余均值: <strong>{weekData.remainingAvg.toLocaleString()}</strong> kcal/天
        </div>
      )}
    </div>
  );
};

const styles = {
  card: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)',
    padding: 'var(--space-lg)',
    marginBottom: 'var(--space-xl)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 'var(--space-md)',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  title: {
    fontSize: 'var(--text-md)',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  percent: {
    fontSize: 'var(--text-3xl)',
    fontWeight: '700',
  },
  progressTrack: {
    width: '100%',
    height: '8px',
    background: 'var(--bg-primary)',
    borderRadius: 'var(--radius-full)',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  progressFill: {
    height: '100%',
    borderRadius: 'var(--radius-full)',
    transition: 'width 0.5s ease',
  },
  budgetText: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-secondary)',
    marginBottom: 'var(--space-lg)',
  },
  daysRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '4px',
    marginBottom: 'var(--space-md)',
  },
  dayCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    flex: 1,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 2px',
    borderRadius: 'var(--radius-base)',
  },
  dayLabel: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
  block: {
    width: '100%',
    height: '40px',
    background: 'var(--bg-primary)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'flex-end',
  },
  blockToday: {
    border: '2px solid var(--accent)',
  },
  blockFill: {
    width: '100%',
    borderRadius: '0 0 var(--radius-sm) var(--radius-sm)',
    transition: 'height 0.3s ease',
    opacity: 0.7,
  },
  dayCalories: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    fontWeight: '500',
    fontVariantNumeric: 'tabular-nums',
  },
  arrow: {
    height: '14px',
    display: 'flex',
    alignItems: 'center',
  },
  avgRow: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-secondary)',
    textAlign: 'center',
    paddingTop: 'var(--space-sm)',
    borderTop: '1px solid var(--border)',
  },
};

export default WeeklyCalorieProgress;
