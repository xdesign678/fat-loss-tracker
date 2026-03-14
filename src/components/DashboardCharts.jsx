import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import EmptyState from './EmptyState';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDate, getDateRange } from '../utils/calculations';

const DashboardCharts = ({ selectedDate, calorieTarget, weightTrendData }) => {
  const { state } = useApp();
  const profile = state.profile || {};
  const [calorieRange, setCalorieRange] = useState(7); // 7, 14, 30 天

  // 根据时间范围重新计算热量数据
  const filteredCalorieData = useMemo(() => {
    return getDateRange(selectedDate, calorieRange).map((date) => {
      const dateKey = formatDate(date);
      const log = state.dailyLogs[dateKey] || { foods: [], exercises: [] };
      const calories = Math.round(log.foods.reduce((sum, food) => sum + (food.calories || 0), 0));
      const target = Math.round(calorieTarget || 0);

      return {
        date: formatDate(date, 'MM/DD'),
        calories,
        target,
        isOverTarget: calories > target,
      };
    });
  }, [calorieRange, selectedDate, state.dailyLogs, calorieTarget]);

  // 线性回归预测体重趋势
  const predictedWeightData = useMemo(() => {
    if (weightTrendData.length < 3) return [];

    // 简单线性回归
    const n = weightTrendData.length;
    const xValues = weightTrendData.map((_, i) => i);
    const yValues = weightTrendData.map((d) => d.weight);

    const sumX = xValues.reduce((sum, x) => sum + x, 0);
    const sumY = yValues.reduce((sum, y) => sum + y, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // 预测未来 7 天
    const predictions = [];
    for (let i = 1; i <= 7; i++) {
      const x = n - 1 + i;
      const predictedWeight = slope * x + intercept;
      predictions.push({
        date: `+${i}天`,
        weight: null,
        predictedWeight: parseFloat(predictedWeight.toFixed(1)),
      });
    }

    return predictions;
  }, [weightTrendData]);

  // 合并实际数据和预测数据
  const combinedWeightData = useMemo(() => {
    return [
      ...weightTrendData.map(d => ({ ...d, predictedWeight: null })),
      ...predictedWeightData,
    ];
  }, [weightTrendData, predictedWeightData]);

  const hasCalorieData = filteredCalorieData.some(d => d.calories > 0);
  const hasWeightData = weightTrendData.length > 1;
  // 热量图表 tooltip
  const calorieTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const isOver = data.calories > data.target;

    return (
      <div style={styles.tooltip}>
        <div style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
          {data.date}
        </div>
        <div style={{ color: isOver ? 'var(--danger)' : 'var(--success)', marginBottom: '4px' }}>
          实际摄入: {data.calories} kcal
        </div>
        <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>
          目标: {data.target} kcal
        </div>
        <div style={{ fontSize: '12px', color: isOver ? 'var(--danger)' : 'var(--success)' }}>
          {isOver ? `超标 ${data.calories - data.target} kcal` : `达标 ✓`}
        </div>
      </div>
    );
  };

  // 体重图表 tooltip
  const weightTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;

    return (
      <div style={styles.tooltip}>
        <div style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
          {data.date}
        </div>
        {data.weight && (
          <div style={{ color: 'var(--success)', marginBottom: '4px' }}>
            实际体重: {data.weight} kg
          </div>
        )}
        {data.predictedWeight && (
          <div style={{ color: 'var(--accent)', fontSize: '12px' }}>
            预测体重: {data.predictedWeight} kg
          </div>
        )}
        {profile.targetWeight && data.weight && (
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            距离目标: {(data.weight - profile.targetWeight).toFixed(1)} kg
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* 热量趋势图 */}
      <div style={styles.chartCard} className="card-hover">
        <div style={styles.chartHeader}>
          <div style={styles.chartTitle}>热量趋势（截至 {formatDate(selectedDate, 'MM/DD')}）</div>
          <div style={styles.rangeButtons}>
            {[7, 14, 30].map((days) => (
              <button
                key={days}
                type="button"
                style={{
                  ...styles.rangeButton,
                  ...(calorieRange === days ? styles.rangeButtonActive : {}),
                }}
                className="btn-interactive"
                onClick={() => setCalorieRange(days)}
              >
                {days}天
              </button>
            ))}
          </div>
        </div>

        {!hasCalorieData ? (
          <div style={{ padding: '20px 0' }}>
            <EmptyState
              icon={BarChart3}
              title="暂无热量数据"
              description="开始记录饮食，查看热量趋势分析"
            />
          </div>
        ) : (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={filteredCalorieData}>
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
                <Tooltip content={calorieTooltip} />
                {/* 目标热量参考线 */}
                <ReferenceLine
                  y={filteredCalorieData[0]?.target || 0}
                  stroke="var(--warning)"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{ value: '目标', fill: 'var(--warning)', fontSize: 12 }}
                />
                {/* 根据是否超标使用不同颜色 */}
                <Bar
                  dataKey="calories"
                  radius={[8, 8, 0, 0]}
                  name="实际摄入"
                  fill="var(--accent)"
                  shape={(props) => {
                    const { x, y, width, height, payload } = props;
                    const color = payload.isOverTarget ? 'var(--danger)' : 'var(--success)';
                    return (
                      <rect
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        fill={color}
                        rx={8}
                        ry={8}
                      />
                    );
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 体重趋势图 */}
      <div style={styles.chartCard} className="card-hover">
        <div style={styles.chartTitle}>体重趋势（最近记录 + 7 天预测）</div>

        {!hasWeightData ? (
          <div style={{ padding: '20px 0' }}>
            <EmptyState
              icon={TrendingUp}
              title="暂无体重数据"
              description="记录至少2次体重，开启趋势分析"
            />
          </div>
        ) : (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={combinedWeightData}>
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
                <Tooltip content={weightTooltip} />
                {/* 目标体重参考线 */}
                {profile.targetWeight && (
                  <ReferenceLine
                    y={profile.targetWeight}
                    stroke="var(--accent)"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    label={{ value: '目标', fill: 'var(--accent)', fontSize: 12 }}
                  />
                )}
                {/* 实际体重线 */}
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="var(--success)"
                  strokeWidth={3}
                  dot={{ fill: 'var(--success)', r: 5 }}
                  name="实际体重"
                  connectNulls={false}
                />
                {/* 预测体重线（虚线） */}
                <Line
                  type="monotone"
                  dataKey="predictedWeight"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: 'var(--accent)', r: 4 }}
                  name="预测趋势"
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </>
  );
};

const styles = {
  chartCard: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  chartTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: 'var(--text-heading)',
  },
  rangeButtons: {
    display: 'flex',
    gap: '8px',
    background: 'var(--bg-primary)',
    borderRadius: '8px',
    padding: '4px',
  },
  rangeButton: {
    padding: '6px 12px',
    fontSize: '13px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    background: 'transparent',
    color: 'var(--text-secondary)',
    transition: 'all 0.2s',
    fontWeight: '500',
  },
  rangeButtonActive: {
    background: 'var(--accent)',
    color: 'white',
  },
  tooltip: {
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--chart-grid)',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '13px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
};

export default DashboardCharts;
