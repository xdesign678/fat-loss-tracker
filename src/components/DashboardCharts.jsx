import { useState, useMemo, memo, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import EmptyState from './EmptyState';
import { BarChart3 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDate, getDateRange } from '../utils/calculations';

const DashboardCharts = memo(({ selectedDate, calorieTarget }) => {
  const { state } = useApp();
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

  const hasCalorieData = filteredCalorieData.some(d => d.calories > 0);
  // 热量图表 tooltip
  const calorieTooltip = useCallback(({ active, payload }) => {
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
  }, []);

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
    </>
  );
});

const styles = {
  chartCard: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)',
    padding: 'var(--space-lg)',
    marginBottom: 'var(--space-xl)',
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 'var(--space-base)',
    flexWrap: 'wrap',
    gap: 'var(--space-md)',
  },
  chartTitle: {
    fontSize: 'var(--text-xl)',
    fontWeight: '600',
    color: 'var(--text-heading)',
  },
  rangeButtons: {
    display: 'flex',
    gap: '8px',
    background: 'var(--bg-primary)',
    borderRadius: 'var(--radius-base)',
    padding: 'var(--space-xs)',
  },
  rangeButton: {
    padding: '6px var(--space-md)',
    fontSize: 'var(--text-sm)',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    cursor: 'pointer',
    background: 'transparent',
    color: 'var(--text-secondary)',
    transition: 'all var(--duration-base)',
    fontWeight: '500',
  },
  rangeButtonActive: {
    background: 'var(--accent)',
    color: 'white',
  },
  tooltip: {
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--chart-grid)',
    borderRadius: 'var(--radius-base)',
    padding: 'var(--space-md)',
    fontSize: 'var(--text-sm)',
    boxShadow: 'var(--shadow-md)',
  },
};

export default DashboardCharts;
