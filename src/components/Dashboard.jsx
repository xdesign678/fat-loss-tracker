import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  calculateBMR,
  calculateTDEE,
  calculateDailyCalorieTarget,
  calculateProgress,
  calculateProteinTarget,
  formatDate,
  getWeekDates
} from '../utils/calculations';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import {
  Flame,
  Drumstick,
  Dumbbell,
  Scale,
  TrendingDown,
  Lightbulb
} from 'lucide-react';

const Dashboard = () => {
  const { state, dispatch } = useApp();
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [newWeight, setNewWeight] = useState('');

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
    '记录饮食能让减脂效率提高50%以上'
  ];

  const todayTip = tips[Math.floor(Math.random() * tips.length)];

  // 计算今日数据
  const profile = state.profile || {};
  const today = formatDate(new Date());
  const todayLog = state.dailyLogs[today] || { foods: [], exercises: [] };
  const todayCalories = Math.round(todayLog.foods.reduce((sum, f) => sum + (f.calories || 0), 0));
  const todayProtein = Math.round(todayLog.foods.reduce((sum, f) => sum + (f.protein || 0), 0));
  const todayExercise = Math.round(todayLog.exercises.reduce((sum, e) => sum + (e.calories || 0), 0));

  const bmr = profile.height && profile.age && profile.currentWeight
    ? calculateBMR(profile.currentWeight, profile.height, profile.age)
    : 0;

  const tdee = bmr && profile.activityLevel
    ? calculateTDEE(bmr, profile.activityLevel)
    : 0;

  const dailyCalorieTarget = tdee
    ? calculateDailyCalorieTarget(tdee, 0.5)
    : 0;

  const proteinTarget = profile.currentWeight
    ? calculateProteinTarget(profile.currentWeight)
    : 0;

  const progress = profile.startWeight && profile.currentWeight && profile.targetWeight
    ? calculateProgress(profile.startWeight, profile.currentWeight, profile.targetWeight)
    : 0;

  // 本周热量数据（实际数据）
  const weekDates = getWeekDates();
  const weeklyCalorieData = weekDates.map((date) => {
    const dateKey = formatDate(date);
    const log = state.dailyLogs[dateKey] || { foods: [], exercises: [] };
    const cal = Math.round(log.foods.reduce((s, f) => s + (f.calories || 0), 0));
    return {
      date: formatDate(date, 'MM/DD'),
      calories: cal,
      target: Math.round(dailyCalorieTarget)
    };
  });

  // 体重趋势数据（实际记录）
  const weightTrendData = state.weightHistory.length > 0
    ? state.weightHistory.slice(-14).map((entry) => ({
        date: formatDate(new Date(entry.date), 'MM/DD'),
        weight: entry.weight
      }))
    : [{ date: formatDate(new Date(), 'MM/DD'), weight: profile.currentWeight || 0 }];

  const handleSaveWeight = () => {
    if (!newWeight) return;

    dispatch({
      type: 'LOG_WEIGHT',
      payload: {
        weight: parseFloat(newWeight),
        date: formatDate(new Date())
      }
    });

    setShowWeightModal(false);
    setNewWeight('');
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: '#0d0f14',
      padding: '24px',
      color: '#e8eaf0'
    },
    header: {
      marginBottom: '32px'
    },
    date: {
      fontSize: '14px',
      color: '#9198b0',
      marginBottom: '8px'
    },
    greeting: {
      fontSize: '28px',
      fontWeight: '700',
      background: 'linear-gradient(135deg, #4f8ef7, #7c5cf7)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
    },
    progressCard: {
      background: '#151820',
      border: '1px solid #252a38',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '24px'
    },
    progressHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px'
    },
    progressTitle: {
      fontSize: '16px',
      color: '#9198b0',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    progressPercent: {
      fontSize: '24px',
      fontWeight: '700',
      background: 'linear-gradient(135deg, #4f8ef7, #7c5cf7)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
    },
    progressBar: {
      width: '100%',
      height: '12px',
      background: '#0d0f14',
      borderRadius: '6px',
      overflow: 'hidden',
      marginBottom: '12px'
    },
    progressFill: {
      height: '100%',
      background: 'linear-gradient(90deg, #4f8ef7, #7c5cf7)',
      borderRadius: '6px',
      transition: 'width 0.5s ease'
    },
    progressLabels: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '12px',
      color: '#9198b0'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '16px',
      marginBottom: '24px'
    },
    statCard: {
      background: '#151820',
      border: '1px solid #252a38',
      borderRadius: '16px',
      padding: '20px',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    statCardHover: {
      border: '1px solid #4f8ef7',
      transform: 'translateY(-2px)'
    },
    statHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '12px'
    },
    statIcon: {
      color: '#4f8ef7'
    },
    statLabel: {
      fontSize: '14px',
      color: '#9198b0'
    },
    statValue: {
      fontSize: '32px',
      fontWeight: '700',
      background: 'linear-gradient(135deg, #4f8ef7, #7c5cf7)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      marginBottom: '4px'
    },
    statSubtext: {
      fontSize: '12px',
      color: '#9198b0'
    },
    chartCard: {
      background: '#151820',
      border: '1px solid #252a38',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '24px'
    },
    chartTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#e8eaf0',
      marginBottom: '20px'
    },
    tipCard: {
      background: 'rgba(46,204,113,0.08)',
      border: '1px solid rgba(46,204,113,0.2)',
      borderRadius: '16px',
      padding: '20px',
      display: 'flex',
      gap: '16px'
    },
    tipIcon: {
      color: '#2ecc71',
      flexShrink: 0
    },
    tipContent: {
      flex: 1
    },
    tipTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#2ecc71',
      marginBottom: '8px'
    },
    tipText: {
      fontSize: '14px',
      color: '#e8eaf0',
      lineHeight: '1.6'
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modalContent: {
      background: '#151820',
      border: '1px solid #252a38',
      borderRadius: '16px',
      padding: '32px',
      width: '90%',
      maxWidth: '400px'
    },
    modalTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#e8eaf0',
      marginBottom: '24px'
    },
    inputWrapper: {
      position: 'relative',
      background: 'linear-gradient(135deg, rgba(79, 142, 247, 0.1), rgba(124, 92, 247, 0.1))',
      borderRadius: '12px',
      padding: '1px',
      marginBottom: '24px'
    },
    input: {
      width: '100%',
      padding: '14px 16px',
      background: '#0d0f14',
      border: 'none',
      borderRadius: '11px',
      fontSize: '16px',
      color: '#e8eaf0',
      outline: 'none'
    },
    buttonGroup: {
      display: 'flex',
      gap: '12px'
    },
    button: {
      flex: 1,
      padding: '12px',
      borderRadius: '8px',
      border: 'none',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    buttonPrimary: {
      background: 'linear-gradient(135deg, #4f8ef7, #7c5cf7)',
      color: '#ffffff'
    },
    buttonSecondary: {
      background: '#252a38',
      color: '#9198b0'
    }
  };

  const customTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div style={{
        background: '#151820',
        border: '1px solid #252a38',
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
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.date}>{formatDate(new Date(), 'YYYY年MM月DD日')}</div>
        <h1 style={styles.greeting}>今天继续加油！</h1>
      </div>

      {/* 进度卡片 */}
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

      {/* 4个指标卡片 */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <Flame size={20} style={styles.statIcon} />
            <span style={styles.statLabel}>今日摄入</span>
          </div>
          <div style={styles.statValue}>{todayCalories}</div>
          <div style={styles.statSubtext}>目标: {dailyCalorieTarget.toFixed(0)} kcal</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <Drumstick size={20} style={styles.statIcon} />
            <span style={styles.statLabel}>蛋白质</span>
          </div>
          <div style={styles.statValue}>{todayProtein}g</div>
          <div style={styles.statSubtext}>目标: {proteinTarget.toFixed(0)}g</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <Dumbbell size={20} style={styles.statIcon} />
            <span style={styles.statLabel}>运动消耗</span>
          </div>
          <div style={styles.statValue}>{todayExercise}</div>
          <div style={styles.statSubtext}>kcal</div>
        </div>

        <div
          style={styles.statCard}
          onClick={() => setShowWeightModal(true)}
        >
          <div style={styles.statHeader}>
            <Scale size={20} style={styles.statIcon} />
            <span style={styles.statLabel}>当前体重</span>
          </div>
          <div style={styles.statValue}>{profile.currentWeight || 0}</div>
          <div style={styles.statSubtext}>点击记录新体重</div>
        </div>
      </div>

      {/* 本周热量趋势图 */}
      <div style={styles.chartCard}>
        <div style={styles.chartTitle}>本周热量趋势</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyCalorieData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#252a38" />
            <XAxis
              dataKey="date"
              stroke="#9198b0"
              tick={{ fill: '#9198b0', fontSize: 12 }}
            />
            <YAxis
              stroke="#9198b0"
              tick={{ fill: '#9198b0', fontSize: 12 }}
            />
            <Tooltip content={customTooltip} />
            <Bar
              dataKey="calories"
              fill="#4f8ef7"
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
            <CartesianGrid strokeDasharray="3 3" stroke="#252a38" />
            <XAxis
              dataKey="date"
              stroke="#9198b0"
              tick={{ fill: '#9198b0', fontSize: 12 }}
            />
            <YAxis
              stroke="#9198b0"
              tick={{ fill: '#9198b0', fontSize: 12 }}
              domain={['dataMin - 2', 'dataMax + 2']}
            />
            <Tooltip content={customTooltip} />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#2ecc71"
              strokeWidth={3}
              dot={{ fill: '#2ecc71', r: 4 }}
              name="体重 (kg)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 健康提示 */}
      <div style={styles.tipCard}>
        <Lightbulb size={24} style={styles.tipIcon} />
        <div style={styles.tipContent}>
          <div style={styles.tipTitle}>今日健康提示</div>
          <div style={styles.tipText}>{todayTip}</div>
        </div>
      </div>

      {/* 体重记录弹窗 */}
      {showWeightModal && (
        <div style={styles.modal} onClick={() => setShowWeightModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>记录新体重</div>
            <div style={styles.inputWrapper}>
              <input
                type="number"
                step="0.1"
                style={styles.input}
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                placeholder="输入当前体重 (kg)"
                autoFocus
              />
            </div>
            <div style={styles.buttonGroup}>
              <button
                style={{ ...styles.button, ...styles.buttonSecondary }}
                onClick={() => setShowWeightModal(false)}
              >
                取消
              </button>
              <button
                style={{ ...styles.button, ...styles.buttonPrimary }}
                onClick={handleSaveWeight}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
