import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatDate } from '../utils/calculations';
import { X, Plus, Minus } from 'lucide-react';

const WeightLogger = ({ isOpen, onClose }) => {
  const { state, dispatch } = useApp();
  const [newWeight, setNewWeight] = useState('');
  const [weightChange, setWeightChange] = useState(null);

  useEffect(() => {
    if (isOpen && state.profile.currentWeight) {
      setNewWeight(state.profile.currentWeight.toFixed(1));
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
      dispatch({
        type: 'LOG_WEIGHT',
        payload: {
          date: today,
          weight: parseFloat(newWeight)
        }
      });
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  if (!isOpen) return null;

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  };

  const modalStyle = {
    background: '#1a1e28',
    borderRadius: '20px',
    padding: '32px',
    maxWidth: '400px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
    position: 'relative'
  };

  const closeButtonStyle = {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'transparent',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    transition: 'all 0.2s'
  };

  const titleStyle = {
    fontSize: '1.8em',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: '24px',
    textAlign: 'center'
  };

  const currentWeightStyle = {
    textAlign: 'center',
    marginBottom: '24px'
  };

  const weightDisplayStyle = {
    fontSize: '3em',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '8px'
  };

  const labelStyle = {
    fontSize: '0.9em',
    color: '#9ca3af',
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
    background: '#252a38',
    border: 'none',
    color: '#ffffff',
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
    background: '#252a38',
    border: '2px solid #3a3f52',
    borderRadius: '12px',
    color: '#ffffff',
    outline: 'none',
    transition: 'border-color 0.2s'
  };

  const changeIndicatorStyle = {
    textAlign: 'center',
    marginBottom: '24px',
    fontSize: '1.1em',
    fontWeight: '600',
    color: weightChange === null ? '#9ca3af' : weightChange > 0 ? '#ef4444' : weightChange < 0 ? '#10b981' : '#9ca3af'
  };

  const saveButtonStyle = {
    width: '100%',
    padding: '16px',
    fontSize: '1.1em',
    fontWeight: '600',
    color: '#ffffff',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="记录体重">
        <button
          type="button"
          style={closeButtonStyle}
          onClick={onClose}
          aria-label="关闭体重记录弹窗"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#252a38';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#9ca3af';
          }}
        >
          <X size={24} />
        </button>

        <h2 style={titleStyle}>记录体重</h2>

        <div style={currentWeightStyle}>
          <div style={labelStyle}>当前体重</div>
          <div style={weightDisplayStyle}>
            {state.profile.currentWeight ? `${state.profile.currentWeight.toFixed(1)} kg` : '--'}
          </div>
        </div>

        <div style={inputContainerStyle}>
          <button
            type="button"
            style={adjustButtonStyle}
            onClick={() => handleAdjust(-0.1)}
            aria-label="减少 0.1 千克"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#4f8ef7';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#252a38';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Minus size={24} />
          </button>

          <input
            type="text"
            inputMode="decimal"
            value={newWeight}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            style={inputStyle}
            placeholder="0.0"
            aria-label="输入当前体重"
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#667eea';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#3a3f52';
            }}
          />

          <button
            type="button"
            style={adjustButtonStyle}
            onClick={() => handleAdjust(0.1)}
            aria-label="增加 0.1 千克"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#4f8ef7';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#252a38';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Plus size={24} />
          </button>
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
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
          }}
        >
          保存记录
        </button>
      </div>
    </div>
  );
};

export default WeightLogger;
