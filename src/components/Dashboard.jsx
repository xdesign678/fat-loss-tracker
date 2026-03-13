import { Suspense, lazy, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import DateNavigator from './DateNavigator';
import { useToast } from './Toast';
import EmptyState from './EmptyState';
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
  Plus,
  Target,
  Calendar,
  TrendingUp,
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
  const showToast = useToast();

  const today = formatDate(new Date());
  const profile = state.profile || {};
  const selectedLog = state.dailyLogs[selectedDate] || { foods: [], exercises: [] };

  // useMemo 缓存当日数据计算
  const dailyStats = useMemo(() => {
    const caloriesConsumed = Math.round(selectedLog.foods.reduce((sum, food) => sum + (food.calories || 0), 0));
    const proteinConsumed = Math.round(selectedLog.foods.reduce((sum, food) => sum + (food.protein || 0), 0));
    const carbsConsumed = Math.round(selectedLog.foods.reduce((sum, food) => sum + (food.carbs || 0), 0));
    const fatConsumed = Math.round(selectedLog.foods.reduce((sum, food) => sum + (food.fat || 0), 0));
    const exerciseCalories = Math.round(selectedLog.exercises.reduce((sum, exercise) => sum + (exercise.calories || 0), 0));

    return { caloriesConsumed, proteinConsumed, carbsConsumed, fatConsumed, exerciseCalories };
  }, [selectedLog.foods, selectedLog.exercises]);

  // useMemo 缓存 BMR/TDEE/目标值计算
  const targets = useMemo(() => {
    const bmr = profile.height && profile.age && profile.currentWeight
      ? calculateBMR(profile.currentWeight, profile.height, profile.age)
      : 0;
    const tdee = bmr && profile.activityLevel ? calculateTDEE(bmr, profile.activityLevel) : 0;
    const calorieTarget = tdee ? calculateDailyCalorieTarget(tdee, 0.5) : 0;
    const proteinTarget = profile.currentWeight ? calculateProteinTarget(profile.currentWeight) : 0;

    return { bmr, tdee, calorieTarget, proteinTarget };
  }, [profile.currentWeight, profile.height, profile.age, profile.activityLevel]);

  // useMemo 缓存进度计算
  const progressData = useMemo(() => {
    const progress = profile.startWeight && profile.currentWeight && profile.targetWeight
      ? calculateProgress(profile.startWeight, profile.currentWeight, profile.targetWeight)
      : 0;

    const weightLost = profile.startWeight && profile.currentWeight
      ? profile.startWeight - profile.currentWeight
      : 0;
    const weightToGo = profile.currentWeight && profile.targetWeight
      ? profile.currentWeight - profile.targetWeight
      : 0;

    // 计算已坚持天数（从首次体重记录开始）
    const daysPersisted = state.weightHistory.length > 0
      ? Math.floor((new Date() - new Date(state.weightHistory[0].date)) / (1000 * 60 * 60 * 24))
      : 0;

    // 计算平均每周减重速度
    const weeksElapsed = daysPersisted / 7;
    const avgWeeklyLoss = weeksElapsed > 0 ? weightLost / weeksElapsed : 0;

    // 预计还需天数
    const daysRemaining = avgWeeklyLoss > 0 ? Math.ceil((weightToGo / avgWeeklyLoss) * 7) : 0;

    return { progress, weightLost, weightToGo, daysPersisted, avgWeeklyLoss, daysRemaining };
  }, [profile.startWeight, profile.currentWeight, profile.targetWeight, state.weightHistory]);

  // useMemo 缓存周热量数据
  const weeklyCalorieData = useMemo(() => {
    return getWeekDates(new Date(selectedDate)).map((date) => {
      const dateKey = formatDate(date);
      const log = state.dailyLogs[dateKey] || { foods: [], exercises: [] };
      return {
        date: formatDate(date, 'MM/DD'),
        calories: Math.round(log.foods.reduce((sum, food) => sum + (food.calories || 0), 0)),
        target: Math.round(targets.calorieTarget),
      };
    });
  }, [selectedDate, state.dailyLogs, targets.calorieTarget]);

  // useMemo 缓存体重趋势数据
  const weightTrendData = useMemo(() => {
    return state.weightHistory.length > 0
      ? state.weightHistory.slice(-14).map((entry) => ({
          date: formatDate(new Date(entry.date), 'MM/DD'),
          weight: entry.weight,
        }))
      : [{ date: formatDate(new Date(), 'MM/DD'), weight: profile.currentWeight || 0 }];
  }, [state.weightHistory, profile.currentWeight]);

  // useMemo 缓存行动计划
  const actionPlan = useMemo(() => {
    return buildDailyActionPlan({
      calorieTarget: targets.calorieTarget,
      caloriesConsumed: dailyStats.caloriesConsumed,
      proteinTarget: targets.proteinTarget,
      proteinConsumed: dailyStats.proteinConsumed,
      exerciseCalories: dailyStats.exerciseCalories,
    });
  }, [targets.calorieTarget, targets.proteinTarget, dailyStats]);

  // 智能健康提示
  const smartTip = useMemo(() => {
    const { caloriesConsumed, proteinConsumed, exerciseCalories } = dailyStats;
    const { calorieTarget, proteinTarget } = targets;

    // 根据当天数据状态选择智能提示
    if (proteinConsumed < proteinTarget * 0.5 && caloriesConsumed > 0) {
      return '您今天的蛋白质摄入不足，建议添加：鸡胸肉（100g=31g蛋白质）、鸡蛋（1个=6g）、希腊酸奶（100g=10g）';
    }
    if (exerciseCalories === 0 && caloriesConsumed > calorieTarget * 0.8) {
      return '今天还没有运动记录，建议进行30分钟快走（消耗~150kcal）或15分钟跳绳（消耗~200kcal）来增加消耗';
    }
    if (caloriesConsumed > calorieTarget * 1.2) {
      return '今天热量超标较多，建议明天适当减少碳水摄入，多吃蔬菜增加饱腹感，并增加运动量';
    }

    // 默认返回每日健康提示
    return getDailyTip(tips, new Date(selectedDate));
  }, [dailyStats, targets, selectedDate]);

  // 判断是否有数据
  const hasData = selectedLog.foods.length > 0 || selectedLog.exercises.length > 0;
  const hasWeightHistory = state.weightHistory.length > 0;

  // 计算统计卡片颜色
  const getCalorieColor = () => {
    const ratio = dailyStats.caloriesConsumed / targets.calorieTarget;
    if (ratio > 1) return 'var(--danger)';
    if (ratio >= 0.9) return 'var(--warning)';
    return 'var(--accent)';
  };

  const getProteinColor = () => {
    const ratio = dailyStats.proteinConsumed / targets.proteinTarget;
    if (ratio > 1.2) return 'var(--danger)';
    if (ratio >= 0.9) return 'var(--success)';
    if (ratio >= 0.7) return 'var(--warning)';
    return 'var(--accent)';
  };

  const styles = {
    container: { minHeight: '100vh', background: 'var(--bg-primary)', padding: '24px', color: 'var(--text-primary)' },
    header: { marginBottom: '24px' },
    date: { fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' },
    greeting: { fontSize: '28px', fontWeight: '700', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    progressCard: { background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', marginBottom: '24px' },
    progressHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
    progressTitle: { fontSize: '16px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' },
    progressPercent: { fontSize: '24px', fontWeight: '700', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    progressBar: { width: '100%', height: '12px', background: 'var(--bg-primary)', borderRadius: '6px', overflow: 'hidden', marginBottom: '12px' },
    progressFill: { height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent-secondary))', borderRadius: '6px', transition: 'width 0.5s ease' },
    progressLabels: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' },
    progressMeta: { display: 'flex', gap: '16px', marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)', flexWrap: 'wrap' },
    progressMetaItem: { display: 'flex', alignItems: 'center', gap: '4px' },
    statCard: { background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', cursor: 'pointer', transition: 'all 0.3s ease' },
    statHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' },
    statLabel: { fontSize: '14px', color: 'var(--text-secondary)' },
    statValue: { fontSize: '32px', fontWeight: '700', marginBottom: '4px' },
    statSubtext: { fontSize: '12px', color: 'var(--text-secondary)' },
    emptyStateContainer: { background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', marginBottom: '24px' },
    actionCard: { background: 'rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.2)', borderRadius: '16px', padding: '18px 20px', marginBottom: '24px' },
    actionCardCalm: { background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' },
    actionCardWarning: { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' },
    actionTitle: { fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' },
    actionHint: { fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '6px' },
    actionSubHint: { fontSize: '13px', color: 'var(--text-muted)' },
    actionButtons: { display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' },
    actionButton: { padding: '6px 12px', fontSize: '13px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'var(--accent)', color: 'white', transition: 'all 0.2s' },
    tipCard: { background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: '16px', padding: '20px', display: 'flex', gap: '16px' },
    tipIcon: { color: 'var(--success)', flexShrink: 0 },
    tipContent: { flex: 1 },
    tipTitle: { fontSize: '14px', fontWeight: '600', color: 'var(--success)', marginBottom: '8px' },
    tipText: { fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.6' },
    chartSkeleton: { background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', marginBottom: '24px', minHeight: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '14px' },
  };

  return (
    <div style={styles.container}>
      <DateNavigator selectedDate={selectedDate} onChange={onDateChange} />
      <div style={styles.header}>
        <div style={styles.date}>{formatDate(selectedDate, 'YYYY年MM月DD日')}</div>
        <h1 style={styles.greeting}>{selectedDate === today ? '今天继续加油！' : '回看这一天'}</h1>
      </div>
      <div style={styles.progressCard} className="card-hover">
        <div style={styles.progressHeader}>
          <div style={styles.progressTitle}><TrendingDown size={20} /> 减脂进度</div>
          <div style={styles.progressPercent} className="countUp">{progressData.progress.toFixed(1)}%</div>
        </div>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${Math.min(progressData.progress, 100)}%` }} />
        </div>
        <div style={styles.progressLabels}>
          <span>{profile.startWeight || 0} kg</span>
          <span>{profile.targetWeight || 0} kg</span>
        </div>
        {hasWeightHistory && progressData.daysPersisted > 0 && (
          <div style={styles.progressMeta}>
            <div style={styles.progressMetaItem}>
              <Calendar size={14} />
              <span>已坚持 {progressData.daysPersisted} 天</span>
            </div>
            {progressData.avgWeeklyLoss > 0 && (
              <>
                <div style={styles.progressMetaItem}>
                  <TrendingDown size={14} />
                  <span>平均每周减重 {progressData.avgWeeklyLoss.toFixed(2)} kg</span>
                </div>
                {progressData.daysRemaining > 0 && (
                  <div style={styles.progressMetaItem}>
                    <Target size={14} />
                    <span>预计还需 {progressData.daysRemaining} 天</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {!hasData ? (
        <div style={styles.emptyStateContainer}>
          <EmptyState
            icon={Plus}
            title="开始记录今天的数据"
            description="添加食物和运动记录，开启你的健康追踪之旅"
            actionLabel="开始记录"
            onAction={() => showToast('请使用底部导航添加食物或运动记录', 'info')}
          />
        </div>
      ) : (
        <div className="responsive-grid-4" style={{ marginBottom: '24px' }}>
          <div style={styles.statCard} className="card-hover">
            <div style={styles.statHeader}>
              <Flame size={20} style={{ color: getCalorieColor() }} />
              <span style={styles.statLabel}>摄入热量</span>
            </div>
            <div style={{ ...styles.statValue, color: getCalorieColor() }} className="countUp">
              {dailyStats.caloriesConsumed}
            </div>
            <div style={styles.statSubtext}>目标: {targets.calorieTarget.toFixed(0)} kcal</div>
          </div>
          <div style={styles.statCard} className="card-hover">
            <div style={styles.statHeader}>
              <Drumstick size={20} style={{ color: getProteinColor() }} />
              <span style={styles.statLabel}>蛋白质</span>
            </div>
            <div style={{ ...styles.statValue, color: getProteinColor() }} className="countUp">
              {dailyStats.proteinConsumed}g
            </div>
            <div style={styles.statSubtext}>目标: {targets.proteinTarget.toFixed(0)}g</div>
          </div>
          <div style={styles.statCard} className="card-hover">
            <div style={styles.statHeader}>
              <Dumbbell size={20} style={{ color: 'var(--success)' }} />
              <span style={styles.statLabel}>运动消耗</span>
            </div>
            <div style={{ ...styles.statValue, color: 'var(--success)' }} className="countUp">
              {dailyStats.exerciseCalories}
            </div>
            <div style={styles.statSubtext}>kcal</div>
          </div>
          <button type="button" style={styles.statCard} className="card-hover btn-interactive" onClick={onOpenWeightLogger} aria-label="打开体重记录">
            <div style={styles.statHeader}>
              <Scale size={20} style={{ color: 'var(--accent-secondary)' }} />
              <span style={styles.statLabel}>当前体重</span>
            </div>
            <div style={{ ...styles.statValue, color: 'var(--accent-secondary)' }} className="countUp">
              {profile.currentWeight || 0}
            </div>
            <div style={styles.statSubtext}>
              {hasWeightHistory ? '点击记录新体重' : '点击记录首次体重'}
            </div>
          </button>
        </div>
      )}
      <div style={{ ...styles.actionCard, ...(actionPlan.tone === 'warning' ? styles.actionCardWarning : actionPlan.tone === 'calm' ? styles.actionCardCalm : {}) }} className="card-hover">
        <div style={styles.actionTitle}>{actionPlan.title}</div>
        <div style={styles.actionHint}>{actionPlan.suggestion}</div>
        <div style={styles.actionSubHint}>{actionPlan.exerciseHint}</div>
        <div style={styles.actionButtons}>
          {dailyStats.proteinConsumed < targets.proteinTarget * 0.7 && (
            <button
              type="button"
              style={styles.actionButton}
              className="btn-interactive"
              onClick={() => showToast('建议添加：鸡胸肉、鸡蛋、豆腐等高蛋白食物', 'info')}
            >
              补充蛋白质
            </button>
          )}
          {dailyStats.exerciseCalories === 0 && (
            <button
              type="button"
              style={styles.actionButton}
              className="btn-interactive"
              onClick={() => showToast('推荐运动：快走30分钟、跳绳15分钟', 'info')}
            >
              查看运动建议
            </button>
          )}
          {dailyStats.caloriesConsumed > targets.calorieTarget && (
            <button
              type="button"
              style={styles.actionButton}
              className="btn-interactive"
              onClick={() => showToast('建议增加运动消耗或调整晚餐摄入', 'warning')}
            >
              调整计划
            </button>
          )}
        </div>
      </div>
      <Suspense fallback={<div style={styles.chartSkeleton}>图表加载中...</div>}>
        <DashboardCharts weeklyCalorieData={weeklyCalorieData} weightTrendData={weightTrendData} />
      </Suspense>
      <div style={styles.tipCard} className="card-hover">
        <Lightbulb size={24} style={styles.tipIcon} />
        <div style={styles.tipContent}>
          <div style={styles.tipTitle}>
            {dailyStats.caloriesConsumed > 0 ? '智能健康提示' : '今日健康提示'}
          </div>
          <div style={styles.tipText}>{smartTip}</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
