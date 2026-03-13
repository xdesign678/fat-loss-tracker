import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '../utils/calculations';
import { shiftDate } from '../utils/tracking';

const DateNavigator = ({ selectedDate, onChange }) => {
  const today = formatDate(new Date());
  const isToday = selectedDate === today;
  const yesterday = shiftDate(today, -1);
  const isYesterday = selectedDate === yesterday;

  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  const containerRef = useRef(null);

  // 格式化日期标签
  const getDateLabel = () => {
    if (isToday) return '今天';
    if (isYesterday) return '昨天';

    // 解析日期并获取星期
    const date = new Date(selectedDate);
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekDay = weekDays[date.getDay()];

    return `${month}/${day} 周${weekDay}`;
  };

  // 处理滑动手势
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    setTouchEndX(e.changedTouches[0].clientX);

    const deltaX = touchStartX - e.changedTouches[0].clientX;
    const minSwipeDistance = 50; // 最小滑动距离

    if (Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // 向左滑动 - 显示下一天（如果不是今天）
        if (selectedDate < today) {
          onChange(shiftDate(selectedDate, 1));
        }
      } else {
        // 向右滑动 - 显示前一天
        onChange(shiftDate(selectedDate, -1));
      }
    }
  };

  return (
    <div
      ref={containerRef}
      style={styles.container}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button
        type="button"
        onClick={() => onChange(shiftDate(selectedDate, -1))}
        style={styles.arrowButton}
        className="btn-interactive"
        aria-label="查看前一天"
      >
        <ChevronLeft size={18} />
      </button>

      <div style={styles.center}>
        <div style={styles.label}>{getDateLabel()}</div>
        {!isToday && (
          <button
            type="button"
            onClick={() => onChange(today)}
            style={styles.todayButton}
            className="btn-interactive"
          >
            回到今天
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => onChange(shiftDate(selectedDate, 1))}
        style={{
          ...styles.arrowButton,
          opacity: selectedDate >= today ? 0.4 : 1,
          cursor: selectedDate >= today ? 'not-allowed' : 'pointer'
        }}
        className={selectedDate < today ? "btn-interactive" : ""}
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
    minWidth: '44px',
    minHeight: '44px',
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    border: 'none',
    background: 'var(--bg-secondary)',
    color: 'var(--text-heading)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
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
