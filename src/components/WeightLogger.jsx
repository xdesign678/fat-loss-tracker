import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { formatDate } from '../utils/calculations';
import { Plus, Minus } from 'lucide-react';
import { useToast } from './Toast';
import { Modal } from './ui';

const WeightLogger = ({ isOpen, onClose }) => {
  const { state, dispatch } = useApp();
  const showToast = useToast();
  const [newWeight, setNewWeight] = useState('');
  const [weightChange, setWeightChange] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && state.profile.currentWeight) {
      setNewWeight(state.profile.currentWeight.toFixed(1));
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, state.profile.currentWeight]);

  useEffect(() => {
    if (newWeight && state.weightHistory.length > 0) {
      const lastRecord = state.weightHistory[state.weightHistory.length - 1];
      setWeightChange(parseFloat(newWeight) - lastRecord.weight);
    } else {
      setWeightChange(null);
    }
  }, [newWeight, state.weightHistory]);

  const handleAdjust = (amount) => {
    const current = parseFloat(newWeight) || 0;
    setNewWeight((current + amount).toFixed(1));
  };

  const handleSave = () => {
    if (newWeight && parseFloat(newWeight) > 0) {
      if (navigator.vibrate) navigator.vibrate(50);
      const today = formatDate(new Date());
      const weight = parseFloat(newWeight);
      dispatch({ type: 'LOG_WEIGHT', payload: { date: today, weight } });

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
    if (value === '' || /^\d*\.?\d*$/.test(value)) setNewWeight(value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSave();
  };

  const recentRecords = state.weightHistory.slice(-5).reverse();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="400px">
      <h2 style={s.title}>记录体重</h2>

      <div style={s.currentWeight}>
        <div style={s.label}>当前体重</div>
        <div style={s.weightDisplay}>
          {state.profile.currentWeight ? `${state.profile.currentWeight.toFixed(1)} kg` : '--'}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Quick adjustment row */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
          {[{ label: '-1.0kg', amount: -1 }, { label: '-0.5kg', amount: -0.5 }, { label: '+0.5kg', amount: 0.5 }, { label: '+1.0kg', amount: 1 }].map(({ label, amount }) => (
            <button key={label} type="button" style={s.quickBtn} onClick={() => handleAdjust(amount)} className="btn-interactive">{label}</button>
          ))}
        </div>

        {/* Main input */}
        <div style={s.inputContainer}>
          <button type="button" style={s.adjustBtn} onClick={() => handleAdjust(-0.1)} aria-label="减少 0.1 千克" className="btn-interactive">
            <Minus size={24} />
          </button>
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            enterKeyHint="done"
            value={newWeight}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            style={s.input}
            placeholder="0.0"
            aria-label="输入当前体重"
            min="20"
            max="300"
          />
          <button type="button" style={s.adjustBtn} onClick={() => handleAdjust(0.1)} aria-label="增加 0.1 千克" className="btn-interactive">
            <Plus size={24} />
          </button>
        </div>
      </div>

      <div style={{ ...s.changeIndicator, color: weightChange === null ? 'var(--text-secondary)' : weightChange > 0 ? 'var(--danger)' : weightChange < 0 ? 'var(--success)' : 'var(--text-secondary)' }}>
        {weightChange !== null && weightChange !== 0 ? (
          <>{weightChange > 0 ? '↑' : '↓'} {Math.abs(weightChange).toFixed(1)} kg{weightChange > 0 ? ' (增加)' : ' (减少)'}</>
        ) : weightChange === 0 ? '与上次记录相同' : '首次记录'}
      </div>

      <button type="button" style={s.saveBtn} onClick={handleSave} disabled={!newWeight || parseFloat(newWeight) <= 0} aria-label="保存体重记录" className="btn-interactive">
        保存记录
      </button>

      {recentRecords.length > 0 && (
        <div style={s.history}>
          <div style={s.historyTitle}>最近记录</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentRecords.map((record, index) => {
              const prevRecord = index < recentRecords.length - 1 ? recentRecords[index + 1] : null;
              const change = prevRecord ? record.weight - prevRecord.weight : null;
              return (
                <div key={record.date} style={s.historyItem}>
                  <span style={{ color: 'var(--text-secondary)' }}>{record.date}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: 'var(--text-heading)' }}>
                    <span>{record.weight.toFixed(1)} kg</span>
                    {change !== null && (
                      <span style={{ fontSize: '0.9em', color: change > 0 ? 'var(--danger)' : change < 0 ? 'var(--success)' : 'var(--text-secondary)' }}>
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
    </Modal>
  );
};

const s = {
  title: { fontSize: 'var(--text-4xl)', fontWeight: '700', color: 'var(--text-heading)', marginBottom: 'var(--space-xl)', textAlign: 'center' },
  currentWeight: { textAlign: 'center', marginBottom: 'var(--space-xl)' },
  label: { fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' },
  weightDisplay: { fontSize: 'var(--text-4xl)', fontWeight: '700', color: 'var(--text-heading)', marginBottom: 'var(--space-sm)' },
  quickBtn: { padding: 'var(--space-xs) var(--space-md)', fontSize: 'var(--text-sm)', background: 'var(--border)', border: 'none', borderRadius: 'var(--radius-base)', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all var(--duration-base)' },
  inputContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' },
  adjustBtn: { width: '48px', height: '48px', borderRadius: 'var(--radius-full)', background: 'var(--border)', border: 'none', color: 'var(--text-heading)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all var(--duration-base)', flexShrink: 0 },
  input: { width: '140px', padding: 'var(--space-base)', fontSize: 'var(--text-4xl)', fontWeight: '600', textAlign: 'center', background: 'var(--border)', border: '2px solid var(--border-light)', borderRadius: 'var(--radius-lg)', color: 'var(--text-heading)', outline: 'none', transition: 'border-color var(--duration-base)' },
  changeIndicator: { textAlign: 'center', marginBottom: 'var(--space-xl)', fontSize: 'var(--text-lg)', fontWeight: '600' },
  saveBtn: { width: '100%', padding: 'var(--space-base)', fontSize: 'var(--text-lg)', fontWeight: '600', color: '#ffffff', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-lg)', cursor: 'pointer', transition: 'all var(--duration-base)', boxShadow: 'var(--shadow-button)' },
  history: { marginTop: 'var(--space-xl)', paddingTop: 'var(--space-xl)', borderTop: '1px solid var(--border-light)' },
  historyTitle: { fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)', textTransform: 'uppercase', letterSpacing: '1px' },
  historyItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-sm) var(--space-md)', background: 'var(--border)', borderRadius: 'var(--radius-base)', fontSize: 'var(--text-base)' },
};

export default WeightLogger;
