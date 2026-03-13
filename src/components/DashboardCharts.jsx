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
} from 'recharts';

const DashboardCharts = ({ weeklyCalorieData, weightTrendData }) => {
  const customTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div style={styles.tooltip}>
        {payload.map((entry, index) => (
          <div key={index} style={{ color: entry.color, marginBottom: '4px' }}>
            {entry.name}: {entry.value}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div style={styles.chartCard}>
        <div style={styles.chartTitle}>本周热量趋势</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyCalorieData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="date" stroke="var(--chart-text)" tick={{ fill: 'var(--chart-text)', fontSize: 12 }} />
            <YAxis stroke="var(--chart-text)" tick={{ fill: 'var(--chart-text)', fontSize: 12 }} />
            <Tooltip content={customTooltip} />
            <Bar dataKey="calories" fill="var(--accent)" radius={[8, 8, 0, 0]} name="实际摄入" />
            <Bar dataKey="target" fill="rgba(79, 142, 247, 0.3)" radius={[8, 8, 0, 0]} name="目标" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.chartCard}>
        <div style={styles.chartTitle}>体重趋势（最近14天）</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={weightTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="date" stroke="var(--chart-text)" tick={{ fill: 'var(--chart-text)', fontSize: 12 }} />
            <YAxis stroke="var(--chart-text)" tick={{ fill: 'var(--chart-text)', fontSize: 12 }} domain={['dataMin - 2', 'dataMax + 2']} />
            <Tooltip content={customTooltip} />
            <Line type="monotone" dataKey="weight" stroke="var(--success)" strokeWidth={3} dot={{ fill: 'var(--success)', r: 4 }} name="体重 (kg)" />
          </LineChart>
        </ResponsiveContainer>
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
  chartTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: 'var(--text-heading)',
    marginBottom: '20px',
  },
  tooltip: {
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--chart-grid)',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '12px',
  },
};

export default DashboardCharts;
