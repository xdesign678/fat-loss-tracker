# Homepage Redesign: Weekly Calorie Progress + Weight Privacy

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move all weight data to Settings, replace homepage progress card with a GitHub-style weekly calorie progress tracker.

**Architecture:** New `WeeklyCalorieProgress` component on homepage top, powered by a `getWeeklyCalorieData()` utility. Settings modal expands from AI-only to 3-section layout (Profile + Fat-loss Progress + AI). Dashboard removes weight card, progress card, and weight chart.

**Tech Stack:** React 19, Recharts (for weight chart in Settings), Lucide icons, date-fns, CSS-in-JS inline styles

---

### Task 1: Add `getWeeklyCalorieData` utility

**Files:**
- Modify: `src/utils/calculations.js` (append after line 146)

**Step 1: Add the function**

Append to `src/utils/calculations.js`:

```javascript
const DAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

// 获取某日期所在周的热量预算数据（周内动态分配）
export function getWeeklyCalorieData(dailyLogs, dailyTarget, date = new Date()) {
  const weekDates = getWeekDates(date);
  const today = formatDate(new Date());

  let totalConsumed = 0;
  let pastDays = 0;

  const days = weekDates.map((d, i) => {
    const dateKey = formatDate(d);
    const isPast = dateKey <= today;
    const isToday = dateKey === today;
    const log = dailyLogs[dateKey] || { foods: [] };
    const calories = isPast
      ? Math.round(log.foods.reduce((sum, food) => sum + (food.calories || 0), 0))
      : null;

    if (isPast) {
      totalConsumed += calories || 0;
      pastDays++;
    }

    // Status based on original daily target
    let status = 'future';
    if (isPast && calories !== null) {
      const ratio = dailyTarget > 0 ? calories / dailyTarget : 0;
      if (ratio > 1.1) status = 'over';
      else if (ratio > 1.0) status = 'warning';
      else status = 'on_track';
    }

    return { date: dateKey, dayLabel: DAY_LABELS[i], calories, status, isToday };
  });

  const weeklyBudget = Math.round(dailyTarget * 7);
  const remaining = weeklyBudget - totalConsumed;
  const futureDays = 7 - pastDays;
  const remainingAvg = futureDays > 0 ? Math.round(remaining / futureDays) : 0;

  // Add vsBudgetAvg indicator for past days
  for (const day of days) {
    if (day.calories !== null) {
      day.vsBudgetAvg = day.calories > remainingAvg ? 'above' : 'below';
    } else {
      day.vsBudgetAvg = null;
    }
  }

  return {
    weekStart: formatDate(weekDates[0]),
    weekEnd: formatDate(weekDates[6]),
    dailyTarget: Math.round(dailyTarget),
    weeklyBudget,
    totalConsumed,
    remainingAvg,
    progressPercent: weeklyBudget > 0 ? Math.round((totalConsumed / weeklyBudget) * 100) : 0,
    days,
  };
}
```

**Step 2: Verify the export is accessible**

Run: `cd /home/node/a0/workspace/6f88d5db-89ef-4af9-9d88-ee61c84f025e/workspace/fat-loss-tracker && npx vite build --mode development 2>&1 | head -20`

Expected: No import errors related to `getWeeklyCalorieData`.

---

### Task 2: Create `WeeklyCalorieProgress` component

**Files:**
- Create: `src/components/WeeklyCalorieProgress.jsx`

**Step 1: Create the component file**

Create `src/components/WeeklyCalorieProgress.jsx` with this content:

```jsx
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
```

---

### Task 3: Update Dashboard - remove weight, add weekly progress

**Files:**
- Modify: `src/components/Dashboard.jsx`

**Step 1: Update imports**

At line 1-28, replace imports to:
- Remove: `Scale`, `TrendingDown` (progress card icon), `Calendar`, `TrendingUp`, `Target`
- Remove: `calculateProgress`, `getDaysBetween` from calculations import
- Add: import for `WeeklyCalorieProgress`

Specifically:
- Remove `Scale`, `TrendingDown`, `Target`, `Calendar`, `TrendingUp` from lucide imports (keep `Flame`, `Drumstick`, `Dumbbell`, `Lightbulb`, `Plus`)
- Remove `calculateProgress`, `getDaysBetween` from calculations import
- Add `import WeeklyCalorieProgress from './WeeklyCalorieProgress';` after line 16

**Step 2: Remove `progressData` and `weightTrendData` useMemo blocks**

Delete `Dashboard.jsx` lines 82-115 (the `progressData` and `weightTrendData` useMemo blocks). These are no longer needed on the homepage.

**Step 3: Remove `onOpenWeightLogger` prop**

Remove `onOpenWeightLogger` from the component props at line 50. It becomes:
```jsx
const Dashboard = ({ selectedDate, onDateChange }) => {
```

**Step 4: Remove progress card from JSX**

Delete the progress card JSX block (lines 213-247):
```jsx
<div style={styles.progressCard} className="card-hover">
  ...
</div>
```

Replace with the new `WeeklyCalorieProgress` component:
```jsx
<WeeklyCalorieProgress selectedDate={selectedDate} onDateChange={onDateChange} />
```

**Step 5: Remove weight stat card from grid**

Delete the 4th stat card (the weight button, lines 291-302):
```jsx
<button type="button" style={styles.statCard} ... onClick={onOpenWeightLogger}>
  ...
</button>
```

Also change the grid class from `responsive-grid-4` to `responsive-grid-3` at line 260 (if that class doesn't exist, we keep the existing class — it will auto-adjust since there are only 3 children).

**Step 6: Remove `weightTrendData` prop from DashboardCharts**

At line 343, remove the `weightTrendData` prop:
```jsx
<DashboardCharts selectedDate={selectedDate} calorieTarget={targets.calorieTarget} />
```

**Step 7: Clean up unused styles**

Remove from the `styles` object:
- `progressCard`, `progressHeader`, `progressTitle`, `progressPercent`
- `progressBar`, `progressFill`, `progressLabels`, `progressMeta`, `progressMetaItem`

**Step 8: Remove `hasWeightHistory` variable**

Delete line 150: `const hasWeightHistory = state.weightHistory.length > 0;`

---

### Task 4: Update DashboardCharts - remove weight trend chart

**Files:**
- Modify: `src/components/DashboardCharts.jsx`

**Step 1: Remove `weightTrendData` prop and weight-related code**

- Remove `weightTrendData` from component props (line 19)
- Remove `Line`, `LineChart`, `ReferenceLine` from Recharts imports (keep `BarChart`, `Bar`, `XAxis`, `YAxis`, `Tooltip`, `ResponsiveContainer`, `CartesianGrid`, `ReferenceLine`)
  - Actually keep `ReferenceLine` — it's used by calorie chart. Remove `LineChart` and `Line`.
- Remove `TrendingUp` from lucide import
- Remove `predictedWeightData` useMemo block (lines 42-71)
- Remove `combinedWeightData` useMemo block (lines 74-79)
- Remove `hasWeightData` variable (line 82)
- Remove `weightTooltip` callback (lines 109-136)
- Remove the entire weight trend chart JSX block (lines 221-284)

The component should only render the calorie trend chart.

---

### Task 5: Expand Settings modal with Profile + Progress sections

**Files:**
- Modify: `src/components/Settings.jsx`
- Modify: `src/App.jsx` (pass new props)

**Step 1: Update Settings component signature and imports**

Add new imports to Settings.jsx:
```jsx
import {
  calculateBMR,
  calculateTDEE,
  calculateDailyCalorieTarget,
  calculateProgress,
  getDaysBetween,
  formatDate,
} from '../utils/calculations';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts';
import { Scale, Target, Calendar, TrendingDown, Activity } from 'lucide-react';
```

Update component signature to accept `onOpenWeightLogger`:
```jsx
const Settings = ({ isOpen, onClose, onOpenWeightLogger }) => {
```

**Step 2: Add profile and progress data computation**

After the existing state hooks (around line 36), add:
```jsx
const profile = state.profile || {};
const weightHistory = state.weightHistory || [];

const progressData = useMemo(() => {
  const progress = profile.startWeight && profile.currentWeight && profile.targetWeight
    ? calculateProgress(profile.startWeight, profile.currentWeight, profile.targetWeight)
    : 0;
  const weightLost = profile.startWeight && profile.currentWeight
    ? profile.startWeight - profile.currentWeight : 0;
  const daysPersisted = profile.startDate ? getDaysBetween(profile.startDate, new Date()) : 0;
  const weeksElapsed = daysPersisted / 7;
  const avgWeeklyLoss = weeksElapsed > 0 ? weightLost / weeksElapsed : 0;
  const weightToGo = profile.currentWeight && profile.targetWeight
    ? profile.currentWeight - profile.targetWeight : 0;
  const daysRemaining = avgWeeklyLoss > 0 ? Math.ceil((weightToGo / avgWeeklyLoss) * 7) : 0;
  return { progress, weightLost, daysPersisted, avgWeeklyLoss, daysRemaining };
}, [profile]);

const weightTrendData = useMemo(() => {
  if (weightHistory.length === 0) return [];
  return weightHistory.slice(-14).map((entry) => ({
    date: formatDate(entry.date, 'MM/DD'),
    weight: entry.weight,
  }));
}, [weightHistory]);
```

Add `useMemo` to the React import at line 1.

**Step 3: Add Profile section and Progress section JSX**

Inside the `<div style={styles.scrollArea}>`, before the AI Gateway Status section, add:

**Section 1: Personal Info**
```jsx
{/* 个人信息 */}
<div style={settStyles.sectionCard}>
  <label style={styles.sectionLabel}>个人信息</label>
  <div style={settStyles.infoGrid}>
    <div style={settStyles.infoItem}>
      <span style={settStyles.infoLabel}>当前体重</span>
      <span style={settStyles.infoValue}>{profile.currentWeight || '--'} kg</span>
    </div>
    <div style={settStyles.infoItem}>
      <span style={settStyles.infoLabel}>身高</span>
      <span style={settStyles.infoValue}>{profile.height || '--'} cm</span>
    </div>
    <div style={settStyles.infoItem}>
      <span style={settStyles.infoLabel}>年龄</span>
      <span style={settStyles.infoValue}>{profile.age || '--'}</span>
    </div>
    <div style={settStyles.infoItem}>
      <span style={settStyles.infoLabel}>目标体重</span>
      <span style={settStyles.infoValue}>{profile.targetWeight || '--'} kg</span>
    </div>
  </div>
  <button
    type="button"
    style={settStyles.recordWeightBtn}
    className="btn-interactive"
    onClick={() => { onOpenWeightLogger(); }}
  >
    <Scale size={16} />
    <span>记录新体重</span>
  </button>
</div>
```

**Section 2: Fat-loss Progress**
```jsx
{/* 减脂进度 */}
<div style={settStyles.sectionCard}>
  <label style={styles.sectionLabel}>减脂进度</label>
  <div style={settStyles.progressHeader}>
    <span style={settStyles.progressPercent}>{progressData.progress}%</span>
    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
      {profile.startWeight || 0} kg → {profile.targetWeight || 0} kg
    </span>
  </div>
  <div style={settStyles.progressTrack}>
    <div style={{ ...settStyles.progressFill, width: `${Math.min(progressData.progress, 100)}%` }} />
  </div>
  {progressData.daysPersisted > 0 && (
    <div style={settStyles.metaRow}>
      <span><Calendar size={13} /> 已坚持 {progressData.daysPersisted} 天</span>
      {progressData.avgWeeklyLoss > 0 && (
        <span><TrendingDown size={13} /> 周均 -{progressData.avgWeeklyLoss.toFixed(2)} kg</span>
      )}
      {progressData.daysRemaining > 0 && (
        <span><Target size={13} /> 约 {progressData.daysRemaining} 天</span>
      )}
    </div>
  )}
  {weightTrendData.length > 1 && (
    <div style={{ marginTop: 'var(--space-md)' }}>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={weightTrendData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
          <XAxis dataKey="date" stroke="var(--chart-text)" tick={{ fill: 'var(--chart-text)', fontSize: 11 }} />
          <YAxis stroke="var(--chart-text)" tick={{ fill: 'var(--chart-text)', fontSize: 11 }} domain={['dataMin - 2', 'dataMax + 2']} />
          <Tooltip />
          {profile.targetWeight && (
            <ReferenceLine y={profile.targetWeight} stroke="var(--accent)" strokeDasharray="5 5" strokeWidth={1.5} />
          )}
          <Line type="monotone" dataKey="weight" stroke="var(--success)" strokeWidth={2} dot={{ fill: 'var(--success)', r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )}
</div>
```

**Step 4: Add section card styles**

After the existing `styles` object (line 256), add a new `settStyles` object:

```javascript
const settStyles = {
  sectionCard: {
    background: 'var(--bg-primary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-base)',
    padding: 'var(--space-lg)',
    marginBottom: 'var(--space-lg)',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--space-md)',
    marginBottom: 'var(--space-md)',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  infoLabel: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  infoValue: {
    fontSize: 'var(--text-lg)',
    fontWeight: '600',
    color: 'var(--text-heading)',
  },
  recordWeightBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-sm)',
    padding: 'var(--space-md)',
    background: 'var(--accent)',
    border: 'none',
    borderRadius: 'var(--radius-base)',
    color: '#fff',
    fontSize: 'var(--text-base)',
    fontWeight: '500',
    cursor: 'pointer',
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 'var(--space-sm)',
  },
  progressPercent: {
    fontSize: 'var(--text-2xl)',
    fontWeight: '700',
    color: 'var(--accent)',
  },
  progressTrack: {
    width: '100%',
    height: '6px',
    background: 'var(--border)',
    borderRadius: 'var(--radius-full)',
    overflow: 'hidden',
    marginBottom: 'var(--space-md)',
  },
  progressFill: {
    height: '100%',
    background: 'var(--accent)',
    borderRadius: 'var(--radius-full)',
    transition: 'width 0.5s ease',
  },
  metaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--space-md)',
    fontSize: 'var(--text-sm)',
    color: 'var(--text-secondary)',
  },
};
```

**Step 5: Update Settings modal title**

Change the `<h2>` from "AI 设置" to "设置" (line 122):
```jsx
<h2 style={styles.title}>设置</h2>
```

Wrap the existing AI section with a section card:
```jsx
<div style={settStyles.sectionCard}>
  <label style={styles.sectionLabel}>AI 设置</label>
  {/* ... existing AI content ... */}
</div>
```

**Step 6: Update Settings modal maxWidth**

Change `maxWidth="520px"` to `maxWidth="560px"` to give more room for charts.

---

### Task 6: Update App.jsx - wire up new props

**Files:**
- Modify: `src/App.jsx`

**Step 1: Remove `onOpenWeightLogger` prop from Dashboard**

At lines 63-66, change:
```jsx
<Dashboard
  selectedDate={selectedDate}
  onDateChange={setSelectedDate}
  onOpenWeightLogger={() => setWeightModalOpen(true)}
/>
```
To:
```jsx
<Dashboard
  selectedDate={selectedDate}
  onDateChange={setSelectedDate}
/>
```

Same for the default case at lines 81-84.

**Step 2: Pass `onOpenWeightLogger` to Settings**

At line 225, change:
```jsx
<Settings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
```
To:
```jsx
<Settings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} onOpenWeightLogger={() => setWeightModalOpen(true)} />
```

**Step 3: Update header settings button tooltip**

At line 123, change title from "AI 设置" to "设置":
```jsx
title="设置"
aria-label="打开设置"
```

---

### Task 7: Verify and test

**Step 1: Run build**

```bash
cd /home/node/a0/workspace/6f88d5db-89ef-4af9-9d88-ee61c84f025e/workspace/fat-loss-tracker && npx vite build 2>&1 | tail -10
```

Expected: Build succeeds with no errors.

**Step 2: Run dev server and verify visually**

```bash
cd /home/node/a0/workspace/6f88d5db-89ef-4af9-9d88-ee61c84f025e/workspace/fat-loss-tracker && npm run dev
```

Then verify:
1. Homepage shows weekly calorie progress at top (no weight data visible)
2. Stat cards show 3 items: calories, protein, exercise (no weight)
3. No weight trend chart on homepage
4. Settings modal has 3 sections: personal info, fat-loss progress, AI settings
5. Weight logger accessible from settings "记录新体重" button
6. Clicking day blocks in weekly progress changes selected date
