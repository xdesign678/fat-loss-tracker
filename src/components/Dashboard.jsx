import { Suspense, lazy } from 'react';
import { useApp } from '../context/AppContext';
import DateNavigator from './DateNavigator';
import {
  calculateBMR,
  calculateTDEE,
  calculateDailyCalorieTarget,
  calculateProgress,
  calculateProteinTarget,
  formatDate,
  getDailyTip,
  getWeekDates,
} from '../utils/calculations';
import { buildDailyActionPlan } from '../utils/tracking';
import {
  Flame,
  Drumstick,
  Dumbbell,
  Scale,
  TrendingDown,
  Lightbulb,
} from 'lucide-react';

const DashboardCharts = lazy(() => import('./DashboardCharts'));

const tips = [
  '每餐先吃蔬菜，再吃蛋白质，最后吃碳水，能有效控制血糖和食欲',
  '饭前喝一杯水，可以减少20%的进食量',
  '充足的睡眠能提高30%的减脂效率，建议每晚7-8小时',
  '高蛋白早餐能让你整个上午更有饱腹感',
  '每天步行10000步，相当于额外消耗300-400卡路里',
  '绿茶含有儿茶素，能促进脂肪氧化',
  '力量训练增加肌肉，提高基础代谢率',
  '细嚼慢咽，让大脑有时间接收饱腹信号',
  '用小盘子吃饭，能自然减少15-20%的食量',
  '避免连续3天以上的极低热量饮食，会降低代谢',
  '每周至少安排一次欺骗餐，保持代谢活跃',
  '有氧运动最佳时长是30-45分钟，过长会分解肌肉',
  '优质脂肪不会让你发胖，坚果、牛油果、橄榄油要适量摄入',
  '压力会导致皮质醇升高，增加腹部脂肪堆积',
  '记录饮食能让减脂效率提高50%以上',
];

const Dashboard = ({ selectedDate, onDateChange, onOpenWeightLogger }) => {
  const { state } = useApp();

  const today = formatDate(new Date());
  const profile = state.profile || {};
  const selectedLog = state.dailyLogs[selectedDate] || { foods: [], exercises: [] };
  const caloriesConsumed = Math.round(selectedLog.foods.reduce((sum, food) => sum + (food.calories || 0), 0));
  const proteinConsumed = Math.round(selectedLog.foods.reduce((sum, food) => sum + (food.protein || 0), 0));
  const exerciseCalories = Math.round(selectedLog.exercises.reduce((sum, exercise) => sum + (exercise.calories || 0), 0));

  const bmr = profile.height && profile.age && profile.currentWeight
    ? calculateBMR(profile.currentWeight, profile.height, profile.age)
    : 0;
  const tdee = bmr && profile.activityLevel ? calculateTDEE(bmr, profile.activityLevel) : 0;
  const calorieTarget = tdee ? calculateDailyCalorieTarget(tdee, 0.5) : 0;
  const proteinTarget = profile.currentWeight ? calculateProteinTarget(profile.currentWeight) : 0;
  const progress = profile.startWeight && profile.currentWeight && profile.targetWeight
    ? calculateProgress(profile.startWeight, profile.currentWeight, profile.targetWeight)
    : 0;

  const weeklyCalorieData = getWeekDates(new Date(selectedDate)).map((date) => {
    const dateKey = formatDate(date);
    const log = state.dailyLogs[dateKey] || { foods: [], exercises: [] };
    return {
      date: formatDate(date, 'MM/DD'),
      calories: Math.round(log.foods.reduce((sum, food) => sum + (food.calories || 0), 0)),
      target: Math.round(calorieTarget),
    };
  });

  const weightTrendData = state.weightHistory.length > 0
    ? state.weightHistory.slice(-14).map((entry) => ({
        date: formatDate(new Date(entry.date), 'MM/DD'),
        weight: entry.weight,
      }))
    : [{ date: formatDate(new Date(), 'MM/DD'), weight: profile.currentWeight || 0 }];

  const actionPlan = buildDailyActionPlan({
    calorieTarget,
    caloriesConsumed,
    proteinTarget,
    proteinConsumed,
    exerciseCalories,
  });

  const todayTip = getDailyTip(tips, new Date(selectedDate));

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      padding: '24px',
<<<<<<< HEAD
      color: '#e8eaf0',
=======
      color: 'var(--text-primary)'
>>>>>>> 0ee8057 (feat: 添加语音记录功能和主题系统)
    },
    header: {
      marginBottom: '24px',
    },
    date: {
      fontSize: '14px',
<<<<<<< HEAD
      color: '#9198b0',
      marginBottom: '8px',
=======
      color: 'var(--text-secondary)',
      marginBottom: '8px'
>>>>>>> 0ee8057 (feat: 添加语音记录功能和主题系统)
    },
    greeting: {
      fontSize: '28px',
      fontWeight: '700',
      background: 'var(--accent-gradient)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    progressCard: {
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '24px',
    },
    progressHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
    },
    progressTitle: {
      fontSize: '16px',
      color: 'var(--text-secondary)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    progressPercent: {
      fontSize: '24px',
      fontWeight: '700',
      background: 'var(--accent-gradient)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    progressBar: {
      width: '100%',
      height: '12px',
      background: 'var(--bg-primary)',
      borderRadius: '6px',
      overflow: 'hidden',
      marginBottom: '12px',
    },
    progressFill: {
      height: '100%',
      background: 'linear-gradient(90deg, var(--accent), var(--accent-secondary))',
      borderRadius: '6px',
      transition: 'width 0.5s ease',
    },
    progressLabels: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '12px',
<<<<<<< HEAD
      color: '#9198b0',
=======
      color: 'var(--text-secondary)'
>>>>>>> 0ee8057 (feat: 添加语音记录功能和主题系统)
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '16px',
      marginBottom: '24px',
    },
    statCard: {
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      padding: '20px',
      cursor: 'pointer',
<<<<<<< HEAD
      transition: 'all 0.3s ease',
=======
      transition: 'all 0.3s ease'
    },
    statCardHover: {
      border: '1px solid var(--accent)',
      transform: 'translateY(-2px)'
>>>>>>> 0ee8057 (feat: 添加语音记录功能和主题系统)
    },
    statHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '12px',
    },
    statIcon: {
<<<<<<< HEAD
      color: '#4f8ef7',
    },
    statLabel: {
      fontSize: '14px',
      color: '#9198b0',
=======
      color: 'var(--accent)'
    },
    statLabel: {
      fontSize: '14px',
      color: 'var(--text-secondary)'
>>>>>>> 0ee8057 (feat: 添加语音记录功能和主题系统)
    },
    statValue: {
      fontSize: '32px',
      fontWeight: '700',
      background: 'var(--accent-gradient)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      marginBottom: '4px',
    },
    statSubtext: {
      fontSize: '12px',
<<<<<<< HEAD
      color: '#9198b0',
    },
    actionCard: {
      background: 'rgba(79,142,247,0.08)',
      border: '1px solid rgba(79,142,247,0.2)',
=======
      color: 'var(--text-secondary)'
    },
    chartCard: {
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
>>>>>>> 0ee8057 (feat: 添加语音记录功能和主题系统)
      borderRadius: '16px',
      padding: '18px 20px',
      marginBottom: '24px',
    },
    actionCardCalm: {
      background: 'rgba(245,158,11,0.08)',
      border: '1px solid rgba(245,158,11,0.2)',
    },
    actionCardWarning: {
      background: 'rgba(239,68,68,0.08)',
      border: '1px solid rgba(239,68,68,0.2)',
    },
    actionTitle: {
      fontSize: '18px',
<<<<<<< HEAD
      fontWeight: '700',
      color: '#e8eaf0',
      marginBottom: '8px',
    },
    actionHint: {
      fontSize: '14px',
      color: '#c7cfde',
      lineHeight: '1.6',
      marginBottom: '6px',
    },
    actionSubHint: {
      fontSize: '13px',
      color: '#9198b0',
=======
      fontWeight: '600',
      color: 'var(--text-primary)',
      marginBottom: '20px'
>>>>>>> 0ee8057 (feat: 添加语音记录功能和主题系统)
    },
    tipCard: {
      background: 'var(--success-bg)',
      border: '1px solid var(--success-border)',
      borderRadius: '16px',
      padding: '20px',
      display: 'flex',
      gap: '16px',
    },
    tipIcon: {
<<<<<<< HEAD
      color: '#2ecc71',
      flexShrink: 0,
=======
      color: 'var(--success)',
      flexShrink: 0
>>>>>>> 0ee8057 (feat: 添加语音记录功能和主题系统)
    },
    tipContent: {
      flex: 1,
    },
    tipTitle: {
      fontSize: '14px',
      fontWeight: '600',
<<<<<<< HEAD
      color: '#2ecc71',
      marginBottom: '8px',
    },
    tipText: {
      fontSize: '14px',
      color: '#e8eaf0',
      lineHeight: '1.6',
    },
    chartSkeleton: {
      background: '#151820',
      border: '1px solid #252a38',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '24px',
      minHeight: '180px',
=======
      color: 'var(--success)',
      marginBottom: '8px'
    },
    tipText: {
      fontSize: '14px',
      color: 'var(--text-primary)',
      lineHeight: '1.6'
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'var(--bg-overlay-heavy)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modalContent: {
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      padding: '32px',
      width: '90%',
      maxWidth: '400px'
    },
    modalTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: 'var(--text-primary)',
      marginBottom: '24px'
    },
    inputWrapper: {
      position: 'relative',
      background: 'var(--input-gradient-border)',
      borderRadius: '12px',
      padding: '1px',
      marginBottom: '24px'
    },
    input: {
      width: '100%',
      padding: '14px 16px',
      background: 'var(--bg-primary)',
      border: 'none',
      borderRadius: '11px',
      fontSize: '16px',
      color: 'var(--text-primary)',
      outline: 'none'
    },
    buttonGroup: {
>>>>>>> 0ee8057 (feat: 添加语音记录功能和主题系统)
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#9198b0',
      fontSize: '14px',
    },
<<<<<<< HEAD
=======
    buttonPrimary: {
      background: 'var(--accent-gradient)',
      color: '#ffffff'
    },
    buttonSecondary: {
      background: 'var(--border)',
      color: 'var(--text-secondary)'
    }
  };

  const customTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '12px',
        fontSize: '12px'
      }}>
        {payload.map((entry, index) => (
          <div key={index} style={{ color: entry.color, marginBottom: '4px' }}>
            {entry.name}: {entry.value}
          </div>
        ))}
      </div>
    );
>>>>>>> 0ee8057 (feat: 添加语音记录功能和主题系统)
  };

  return (
    <div style={styles.container}>
      <DateNavigator selectedDate={selectedDate} onChange={onDateChange} />

      <div style={styles.header}>
        <div style={styles.date}>{formatDate(selectedDate, 'YYYY年MM月DD日')}</div>
        <h1 style={styles.greeting}>{selectedDate === today ? '今天继续加油！' : '回看这一天'}</h1>
      </div>

      <div style={styles.progressCard}>
        <div style={styles.progressHeader}>
          <div style={styles.progressTitle}>
            <TrendingDown size={20} />
            减脂进度
          </div>
          <div style={styles.progressPercent}>{progress.toFixed(1)}%</div>
        </div>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${Math.min(progress, 100)}%` }} />
        </div>
        <div style={styles.progressLabels}>
          <span>{profile.startWeight || 0} kg</span>
          <span>{profile.targetWeight || 0} kg</span>
        </div>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <Flame size={20} style={styles.statIcon} />
            <span style={styles.statLabel}>摄入热量</span>
          </div>
          <div style={styles.statValue}>{caloriesConsumed}</div>
          <div style={styles.statSubtext}>目标: {calorieTarget.toFixed(0)} kcal</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <Drumstick size={20} style={styles.statIcon} />
            <span style={styles.statLabel}>蛋白质</span>
          </div>
          <div style={styles.statValue}>{proteinConsumed}g</div>
          <div style={styles.statSubtext}>目标: {proteinTarget.toFixed(0)}g</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <Dumbbell size={20} style={styles.statIcon} />
            <span style={styles.statLabel}>运动消耗</span>
          </div>
          <div style={styles.statValue}>{exerciseCalories}</div>
          <div style={styles.statSubtext}>kcal</div>
        </div>

        <button
          type="button"
          style={styles.statCard}
          onClick={onOpenWeightLogger}
          aria-label="打开体重记录"
        >
          <div style={styles.statHeader}>
            <Scale size={20} style={styles.statIcon} />
            <span style={styles.statLabel}>当前体重</span>
          </div>
          <div style={styles.statValue}>{profile.currentWeight || 0}</div>
          <div style={styles.statSubtext}>点击记录新体重</div>
        </button>
      </div>

<<<<<<< HEAD
      <div
        style={{
          ...styles.actionCard,
          ...(actionPlan.tone === 'warning'
            ? styles.actionCardWarning
            : actionPlan.tone === 'calm'
              ? styles.actionCardCalm
              : {}),
        }}
      >
        <div style={styles.actionTitle}>{actionPlan.title}</div>
        <div style={styles.actionHint}>{actionPlan.suggestion}</div>
        <div style={styles.actionSubHint}>{actionPlan.exerciseHint}</div>
      </div>

      <Suspense fallback={<div style={styles.chartSkeleton}>图表加载中...</div>}>
        <DashboardCharts weeklyCalorieData={weeklyCalorieData} weightTrendData={weightTrendData} />
      </Suspense>
=======
      {/* 本周热量趋势图 */}
      <div style={styles.chartCard}>
        <div style={styles.chartTitle}>本周热量趋势</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyCalorieData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis
              dataKey="date"
              stroke="var(--chart-text)"
              tick={{ fill: 'var(--chart-text)', fontSize: 12 }}
            />
            <YAxis
              stroke="var(--chart-text)"
              tick={{ fill: 'var(--chart-text)', fontSize: 12 }}
            />
            <Tooltip content={customTooltip} />
            <Bar
              dataKey="calories"
              fill="var(--accent)"
              radius={[8, 8, 0, 0]}
              name="实际摄入"
            />
            <Bar
              dataKey="target"
              fill="rgba(79, 142, 247, 0.3)"
              radius={[8, 8, 0, 0]}
              name="目标"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 体重趋势图 */}
      <div style={styles.chartCard}>
        <div style={styles.chartTitle}>体重趋势（最近14天）</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={weightTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis
              dataKey="date"
              stroke="var(--chart-text)"
              tick={{ fill: 'var(--chart-text)', fontSize: 12 }}
            />
            <YAxis
              stroke="var(--chart-text)"
              tick={{ fill: 'var(--chart-text)', fontSize: 12 }}
              domain={['dataMin - 2', 'dataMax + 2']}
            />
            <Tooltip content={customTooltip} />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="var(--success)"
              strokeWidth={3}
              dot={{ fill: 'var(--success)', r: 4 }}
              name="体重 (kg)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
>>>>>>> 0ee8057 (feat: 添加语音记录功能和主题系统)

      <div style={styles.tipCard}>
        <Lightbulb size={24} style={styles.tipIcon} />
        <div style={styles.tipContent}>
          <div style={styles.tipTitle}>今日健康提示</div>
          <div style={styles.tipText}>{todayTip}</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
