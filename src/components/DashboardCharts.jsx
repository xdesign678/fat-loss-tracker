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
            <CartesianGrid strokeDasharray="3 3" stroke="#252a38" />
            <XAxis dataKey="date" stroke="#9198b0" tick={{ fill: '#9198b0', fontSize: 12 }} />
            <YAxis stroke="#9198b0" tick={{ fill: '#9198b0', fontSize: 12 }} />
            <Tooltip content={customTooltip} />
            <Bar dataKey="calories" fill="#4f8ef7" radius={[8, 8, 0, 0]} name="实际摄入" />
            <Bar dataKey="target" fill="rgba(79, 142, 247, 0.3)" radius={[8, 8, 0, 0]} name="目标" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.chartCard}>
        <div style={styles.chartTitle}>体重趋势（最近14天）</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={weightTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#252a38" />
            <XAxis dataKey="date" stroke="#9198b0" tick={{ fill: '#9198b0', fontSize: 12 }} />
            <YAxis stroke="#9198b0" tick={{ fill: '#9198b0', fontSize: 12 }} domain={['dataMin - 2', 'dataMax + 2']} />
            <Tooltip content={customTooltip} />
            <Line type="monotone" dataKey="weight" stroke="#2ecc71" strokeWidth={3} dot={{ fill: '#2ecc71', r: 4 }} name="体重 (kg)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
};

const styles = {
  chartCard: {
    background: '#151820',
    border: '1px solid #252a38',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
  },
  chartTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#e8eaf0',
    marginBottom: '20px',
  },
  tooltip: {
    background: '#151820',
    border: '1px solid #252a38',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '12px',
  },
};

export default DashboardCharts;
