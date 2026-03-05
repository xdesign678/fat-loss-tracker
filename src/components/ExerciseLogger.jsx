import React, { useState, useMemo } from 'react';
import { Activity, Plus, Edit3, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { exerciseDatabase, adjustCaloriesBurn } from '../utils/foodDatabase';
import { formatDate } from '../utils/calculations';

const ExerciseLogger = () => {
  const { state, dispatch } = useApp();
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [duration, setDuration] = useState(30);
  const [manualExercise, setManualExercise] = useState({
    name: '',
    duration: '',
    calories: ''
  });

  const today = formatDate(new Date());
  const todayLogs = state.dailyLogs[today]?.exercises || [];
  const userWeight = state.profile.currentWeight || 70;

  // Group exerciseDatabase array by category
  const groupedExercises = useMemo(() => {
    const grouped = {};
    exerciseDatabase.forEach((exercise) => {
      if (!grouped[exercise.category]) {
        grouped[exercise.category] = [];
      }
      grouped[exercise.category].push(exercise);
    });
    return grouped;
  }, []);

  const categories = useMemo(() => {
    return Object.keys(groupedExercises);
  }, [groupedExercises]);

  const todayTotal = useMemo(() => {
    return todayLogs.reduce((sum, exercise) => sum + (exercise.calories || 0), 0);
  }, [todayLogs]);

  const getJointImpactColor = (impact) => {
    const colors = {
      '极低': '#2ecc71',
      '低': '#27ae60',
      '中': '#f39c12',
      '高': '#e74c3c',
      '极高': '#c0392b'
    };
    return colors[impact] || '#7f8c8d';
  };

  const handleExerciseSelect = (exercise, category) => {
    setSelectedExercise({ ...exercise, category });
    setDuration(30);
    setShowAddModal(true);
  };

  const calculateCalories = (baseCalories, dur, weight) => {
    // adjustCaloriesBurn adjusts for weight (base 100kg), then scale by duration (base 30min)
    const weightAdjusted = adjustCaloriesBurn(baseCalories, weight);
    return weightAdjusted * (dur / 30);
  };

  const handleAddExercise = () => {
    if (!selectedExercise) return;

    const exercise = {
      name: selectedExercise.name,
      duration: parseInt(duration),
      calories: parseFloat(calculateCalories(selectedExercise.caloriesPer30Min, duration, userWeight)),
      category: selectedExercise.category,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    };

    dispatch({ type: 'LOG_EXERCISE', payload: { date: today, exercise } });
    setShowAddModal(false);
    setSelectedExercise(null);
  };

  const handleManualAdd = () => {
    if (!manualExercise.name || !manualExercise.calories || !manualExercise.duration) return;

    const exercise = {
      name: manualExercise.name,
      duration: parseInt(manualExercise.duration),
      calories: parseFloat(manualExercise.calories),
      category: '其他',
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    };

    dispatch({ type: 'LOG_EXERCISE', payload: { date: today, exercise } });
    setManualExercise({ name: '', duration: '', calories: '' });
    setShowAddModal(false);
  };

  const handleDeleteExercise = (index) => {
    dispatch({ type: 'REMOVE_EXERCISE', payload: { date: today, index } });
  };

  const toggleCategory = (category) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  return (
    <div style={styles.container}>
      {/* 运动类型选择 */}
      <div style={styles.categoriesSection}>
        <div style={styles.header}>
          <h3 style={styles.sectionTitle}>选择运动类型</h3>
          <button
            onClick={() => {
              setSelectedExercise(null);
              setShowAddModal(true);
            }}
            style={styles.manualButton}
          >
            <Edit3 size={16} />
            <span style={{ marginLeft: '6px' }}>手动输入</span>
          </button>
        </div>

        {categories.map((category) => (
          <div key={category} style={styles.categoryCard}>
            <div
              style={styles.categoryHeader}
              onClick={() => toggleCategory(category)}
            >
              <div style={styles.categoryTitleRow}>
                <Activity size={18} style={{ color: '#4f8ef7' }} />
                <span style={styles.categoryTitle}>{category}</span>
                <span style={styles.categoryCount}>
                  {groupedExercises[category].length}项
                </span>
              </div>
              {expandedCategory === category ? (
                <ChevronUp size={20} style={{ color: '#9ca3af' }} />
              ) : (
                <ChevronDown size={20} style={{ color: '#9ca3af' }} />
              )}
            </div>

            {expandedCategory === category && (
              <div style={styles.exerciseList}>
                {groupedExercises[category].map((exercise, index) => (
                  <div
                    key={index}
                    style={styles.exerciseItem}
                    onClick={() => handleExerciseSelect(exercise, category)}
                  >
                    <div style={styles.exerciseContent}>
                      <div style={styles.exerciseHeader}>
                        <span style={styles.exerciseName}>{exercise.name}</span>
                        <span
                          style={{
                            ...styles.impactBadge,
                            background: getJointImpactColor(exercise.jointImpact)
                          }}
                        >
                          {exercise.jointImpact}冲击
                        </span>
                      </div>
                      <div style={styles.exerciseInfo}>
                        <span>{exercise.caloriesPer30Min}千卡/30分钟</span>
                        {exercise.description && (
                          <>
                            <span style={styles.divider}>|</span>
                            <span>{exercise.description}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 今日记录 */}
      <div style={styles.todaySection}>
        <h3 style={styles.sectionTitle}>今日已记录</h3>
        {todayLogs.length === 0 ? (
          <div style={styles.emptyState}>暂无记录</div>
        ) : (
          <div style={styles.logsList}>
            {todayLogs.map((exercise, index) => (
              <div key={index} style={styles.logItem}>
                <div style={styles.logContent}>
                  <div style={styles.logHeader}>
                    <span style={styles.logName}>{exercise.name}</span>
                    <span style={styles.logTime}>{exercise.time}</span>
                  </div>
                  <div style={styles.logInfo}>
                    <span style={styles.logCategory}>{exercise.category}</span>
                    <span style={styles.divider}>|</span>
                    <span>{exercise.duration}分钟</span>
                    <span style={styles.divider}>|</span>
                    <span style={styles.logCalories}>-{exercise.calories}千卡</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteExercise(index)}
                  style={styles.deleteButton}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 汇总 */}
      <div style={styles.summary}>
        <div style={styles.summaryContent}>
          <div style={styles.summaryLabel}>今日总消耗</div>
          <div style={styles.summaryValue}>-{todayTotal.toFixed(0)}千卡</div>
        </div>
      </div>

      {/* 添加运动弹窗 */}
      {showAddModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            {selectedExercise ? (
              <>
                <h3 style={styles.modalTitle}>{selectedExercise.name}</h3>
                <div style={styles.modalContent}>
                  <div style={styles.exerciseDetails}>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>运动类型</span>
                      <span style={styles.detailValue}>{selectedExercise.category}</span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>关节冲击</span>
                      <span
                        style={{
                          ...styles.impactBadge,
                          background: getJointImpactColor(selectedExercise.jointImpact)
                        }}
                      >
                        {selectedExercise.jointImpact}
                      </span>
                    </div>
                    {selectedExercise.description && (
                      <div style={styles.description}>{selectedExercise.description}</div>
                    )}
                  </div>

                  <label style={styles.label}>
                    <span>运动时长（分钟）</span>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      style={styles.input}
                      autoFocus
                    />
                  </label>

                  <div style={styles.caloriesPreview}>
                    <span style={styles.previewLabel}>预计消耗</span>
                    <span style={styles.previewValue}>
                      {calculateCalories(selectedExercise.caloriesPer30Min, duration, userWeight).toFixed(0)}千卡
                    </span>
                  </div>
                  <div style={styles.hint}>
                    基于你的体重（{userWeight}kg）计算
                  </div>
                </div>
                <div style={styles.modalActions}>
                  <button onClick={() => setShowAddModal(false)} style={styles.cancelButton}>
                    取消
                  </button>
                  <button onClick={handleAddExercise} style={styles.confirmButton}>
                    添加
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 style={styles.modalTitle}>手动输入运动</h3>
                <div style={styles.modalContent}>
                  <label style={styles.label}>
                    <span>运动名称*</span>
                    <input
                      type="text"
                      value={manualExercise.name}
                      onChange={(e) => setManualExercise({ ...manualExercise, name: e.target.value })}
                      style={styles.input}
                      placeholder="例：篮球"
                    />
                  </label>
                  <label style={styles.label}>
                    <span>时长（分钟）*</span>
                    <input
                      type="number"
                      value={manualExercise.duration}
                      onChange={(e) => setManualExercise({ ...manualExercise, duration: e.target.value })}
                      style={styles.input}
                      placeholder="例：60"
                    />
                  </label>
                  <label style={styles.label}>
                    <span>消耗热量（千卡）*</span>
                    <input
                      type="number"
                      value={manualExercise.calories}
                      onChange={(e) => setManualExercise({ ...manualExercise, calories: e.target.value })}
                      style={styles.input}
                      placeholder="例：300"
                    />
                  </label>
                </div>
                <div style={styles.modalActions}>
                  <button onClick={() => setShowAddModal(false)} style={styles.cancelButton}>
                    取消
                  </button>
                  <button onClick={handleManualAdd} style={styles.confirmButton}>
                    添加
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto'
  },
  categoriesSection: {
    marginBottom: '20px'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
    margin: 0
  },
  manualButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    background: '#1a1e28',
    border: '1px solid #252a38',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background 0.3s'
  },
  categoryCard: {
    background: '#151820',
    borderRadius: '8px',
    marginBottom: '8px',
    overflow: 'hidden'
  },
  categoryHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px',
    cursor: 'pointer',
    transition: 'background 0.2s'
  },
  categoryTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flex: 1
  },
  categoryTitle: {
    fontSize: '15px',
    fontWeight: '500',
    color: '#fff'
  },
  categoryCount: {
    fontSize: '13px',
    color: '#6b7280',
    marginLeft: 'auto',
    marginRight: '12px'
  },
  exerciseList: {
    borderTop: '1px solid #252a38'
  },
  exerciseItem: {
    padding: '12px 14px',
    borderBottom: '1px solid #252a38',
    cursor: 'pointer',
    transition: 'background 0.2s'
  },
  exerciseContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  exerciseHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  exerciseName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#fff'
  },
  impactBadge: {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '500',
    color: '#fff'
  },
  exerciseInfo: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '13px',
    color: '#9ca3af'
  },
  divider: {
    margin: '0 8px',
    color: '#3f4451'
  },
  todaySection: {
    marginBottom: '20px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#6b7280',
    fontSize: '14px',
    background: '#151820',
    borderRadius: '8px'
  },
  logsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  logItem: {
    display: 'flex',
    alignItems: 'center',
    background: '#151820',
    borderRadius: '8px',
    padding: '12px',
    transition: 'background 0.2s'
  },
  logContent: {
    flex: 1
  },
  logHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '6px'
  },
  logName: {
    fontSize: '15px',
    fontWeight: '500',
    color: '#fff'
  },
  logTime: {
    fontSize: '12px',
    color: '#6b7280'
  },
  logInfo: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '13px',
    color: '#9ca3af'
  },
  logCategory: {
    color: '#4f8ef7'
  },
  logCalories: {
    color: '#2ecc71',
    fontWeight: '500'
  },
  deleteButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    background: 'transparent',
    border: 'none',
    borderRadius: '6px',
    color: '#6b7280',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginLeft: '8px'
  },
  summary: {
    background: '#151820',
    borderRadius: '12px',
    padding: '20px'
  },
  summaryContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  summaryLabel: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#9ca3af'
  },
  summaryValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#2ecc71'
  },
  modalOverlay: {
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
  },
  modal: {
    background: '#1a1e28',
    borderRadius: '16px',
    padding: '24px',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto'
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#fff',
    marginBottom: '20px'
  },
  modalContent: {
    marginBottom: '20px'
  },
  exerciseDetails: {
    background: '#151820',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '16px'
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 0'
  },
  detailLabel: {
    fontSize: '13px',
    color: '#9ca3af'
  },
  detailValue: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#fff'
  },
  description: {
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid #252a38',
    fontSize: '13px',
    color: '#9ca3af',
    lineHeight: '1.5'
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '16px',
    fontSize: '14px',
    color: '#9ca3af'
  },
  input: {
    marginTop: '6px',
    padding: '10px',
    background: '#151820',
    border: '1px solid #252a38',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none'
  },
  caloriesPreview: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    background: '#151820',
    borderRadius: '8px',
    marginBottom: '8px'
  },
  previewLabel: {
    fontSize: '14px',
    color: '#9ca3af'
  },
  previewValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#2ecc71'
  },
  hint: {
    fontSize: '12px',
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic'
  },
  modalActions: {
    display: 'flex',
    gap: '12px'
  },
  cancelButton: {
    flex: 1,
    padding: '12px',
    background: '#151820',
    border: '1px solid #252a38',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background 0.3s'
  },
  confirmButton: {
    flex: 1,
    padding: '12px',
    background: '#4f8ef7',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background 0.3s'
  }
};

export default ExerciseLogger;
