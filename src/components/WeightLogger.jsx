import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { formatDate } from '../utils/calculations';
import ModalShell from './ModalShell';
import { Plus, Minus } from 'lucide-react';
import { useToast } from './Toast';

const WeightLogger = ({ isOpen, onClose }) => {
  const { state, dispatch } = useApp();
  const showToast = useToast();
  const [newWeight, setNewWeight] = useState('');
  const [weightChange, setWeightChange] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && state.profile.currentWeight) {
      setNewWeight(state.profile.currentWeight.toFixed(1));
      // Focus input when modal opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, state.profile.currentWeight]);

  useEffect(() => {
    if (newWeight && state.weightHistory.length > 0) {
      const lastRecord = state.weightHistory[state.weightHistory.length - 1];
      const change = parseFloat(newWeight) - lastRecord.weight;
      setWeightChange(change);
    } else {
      setWeightChange(null);
    }
  }, [newWeight, state.weightHistory]);

  const handleAdjust = (amount) => {
    const current = parseFloat(newWeight) || 0;
    const adjusted = (current + amount).toFixed(1);
    setNewWeight(adjusted);
  };

  const handleSave = () => {
    if (newWeight && parseFloat(newWeight) > 0) {
      const today = formatDate(new Date());
      const weight = parseFloat(newWeight);

      dispatch({
        type: 'LOG_WEIGHT',
        payload: {
          date: today,
          weight: weight
        }
      });

      // Show toast with change info
      if (weightChange !== null && weightChange !== 0) {
        const changeText = weightChange > 0
          ? `+${Math.abs(weightChange).toFixed(1)}kg`
          : `-${Math.abs(weightChange).toFixed(1)}kg`;
        showToast(`已记录 ${weight.toFixed(1)}kg，较上次 ${changeText}`, 'success');
      } else {
        showToast(`已记录 ${weight.toFixed(1)}kg`, 'success');
      }

      onClose();
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    // 只允许数字和一个小数点
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setNewWeight(value);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Get recent weight records
  const getRecentRecords = () => {
    return state.weightHistory.slice(-5).reverse();
  };

  if (!isOpen) return null;

  const currentWeightStyle = {
    textAlign: 'center',
    marginBottom: '24px'
  };

  const weightDisplayStyle = {
    fontSize: '3em',
    fontWeight: '700',
    background: 'var(--weight-gradient)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '8px'
  };

  const labelStyle = {
    fontSize: '0.9em',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  };

  const inputContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '24px'
  };

  const adjustButtonStyle = {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'var(--border)',
    border: 'none',
    color: 'var(--text-heading)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    flexShrink: 0
  };

  const inputStyle = {
    width: '140px',
    padding: '16px',
    fontSize: '2em',
    fontWeight: '600',
    textAlign: 'center',
    background: 'var(--border)',
    border: '2px solid var(--border-light)',
    borderRadius: '12px',
    color: 'var(--text-heading)',
    outline: 'none',
    transition: 'border-color 0.2s'
  };

  const changeIndicatorStyle = {
    textAlign: 'center',
    marginBottom: '24px',
    fontSize: '1.1em',
    fontWeight: '600',
    color: weightChange === null ? 'var(--text-secondary)' : weightChange > 0 ? 'var(--danger)' : weightChange < 0 ? 'var(--success-alt)' : 'var(--text-secondary)'
  };

  const saveButtonStyle = {
    width: '100%',
    padding: '16px',
    fontSize: '1.1em',
    fontWeight: '600',
    color: '#ffffff',
    background: 'var(--weight-gradient)',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: 'var(--shadow-button)'
  };

  const historyContainerStyle = {
    marginTop: '24px',
    paddingTop: '24px',
    borderTop: '1px solid var(--border-light)'
  };

  const historyTitleStyle = {
    fontSize: '0.9em',
    color: 'var(--text-secondary)',
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  };

  const historyListStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  };

  const historyItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    background: 'var(--border)',
    borderRadius: '8px',
    fontSize: '0.95em'
  };

  const historyDateStyle = {
    color: 'var(--text-secondary)'
  };

  const historyWeightStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '600',
    color: 'var(--text-heading)'
  };

  const historyChangeStyle = (change) => ({
    fontSize: '0.9em',
    color: change > 0 ? 'var(--danger)' : change < 0 ? 'var(--success-alt)' : 'var(--text-secondary)'
  });

  const recentRecords = getRecentRecords();

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="记录体重"
      maxWidth="400px"
      bodyPadding="24px 32px 32px"
      contentStyle={{ borderRadius: '20px' }}
    >
        <div style={currentWeightStyle}>
          <div style={labelStyle}>当前体重</div>
          <div style={weightDisplayStyle}>
            {state.profile.currentWeight ? `${state.profile.currentWeight.toFixed(1)} kg` : '--'}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Quick adjustment buttons row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
            <button
              type="button"
              style={{ padding: '6px 12px', fontSize: '0.85em', background: 'var(--border)', border: 'none', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s' }}
              onClick={() => handleAdjust(-1)}
              className="btn-interactive"
            >
              -1.0kg
            </button>
            <button
              type="button"
              style={{ padding: '6px 12px', fontSize: '0.85em', background: 'var(--border)', border: 'none', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s' }}
              onClick={() => handleAdjust(-0.5)}
              className="btn-interactive"
            >
              -0.5kg
            </button>
            <button
              type="button"
              style={{ padding: '6px 12px', fontSize: '0.85em', background: 'var(--border)', border: 'none', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s' }}
              onClick={() => handleAdjust(0.5)}
              className="btn-interactive"
            >
              +0.5kg
            </button>
            <button
              type="button"
              style={{ padding: '6px 12px', fontSize: '0.85em', background: 'var(--border)', border: 'none', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s' }}
              onClick={() => handleAdjust(1)}
              className="btn-interactive"
            >
              +1.0kg
            </button>
          </div>

          {/* Main input with +/- 0.1 buttons */}
          <div style={inputContainerStyle}>
            <button
              type="button"
              style={adjustButtonStyle}
              onClick={() => handleAdjust(-0.1)}
              aria-label="减少 0.1 千克"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--accent)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--border)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <Minus size={24} />
            </button>

            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              value={newWeight}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              style={inputStyle}
              placeholder="0.0"
              aria-label="输入当前体重"
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-light)';
              }}
            />

            <button
              type="button"
              style={adjustButtonStyle}
              onClick={() => handleAdjust(0.1)}
              aria-label="增加 0.1 千克"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--accent)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--border)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <Plus size={24} />
            </button>
          </div>
        </div>

        <div style={changeIndicatorStyle}>
          {weightChange !== null && weightChange !== 0 ? (
            <>
              {weightChange > 0 ? '↑' : '↓'} {Math.abs(weightChange).toFixed(1)} kg
              {weightChange > 0 ? ' (增加)' : ' (减少)'}
            </>
          ) : weightChange === 0 ? (
            '与上次记录相同'
          ) : (
            '首次记录'
          )}
        </div>

        <button
          type="button"
          style={saveButtonStyle}
          onClick={handleSave}
          disabled={!newWeight || parseFloat(newWeight) <= 0}
          aria-label="保存体重记录"
          className="btn-interactive"
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-button-hover)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'var(--shadow-button)';
          }}
        >
          保存记录
        </button>

        {/* Recent history */}
        {recentRecords.length > 0 && (
          <div style={historyContainerStyle}>
            <div style={historyTitleStyle}>最近记录</div>
            <div style={historyListStyle}>
              {recentRecords.map((record, index) => {
                const prevRecord = index < recentRecords.length - 1 ? recentRecords[index + 1] : null;
                const change = prevRecord ? record.weight - prevRecord.weight : null;
                return (
                  <div key={record.date} style={historyItemStyle}>
                    <span style={historyDateStyle}>{record.date}</span>
                    <div style={historyWeightStyle}>
                      <span>{record.weight.toFixed(1)} kg</span>
                      {change !== null && (
                        <span style={historyChangeStyle(change)}>
                          {change > 0 ? `+${change.toFixed(1)}` : change.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
    </ModalShell>
  );
};

export default WeightLogger;
