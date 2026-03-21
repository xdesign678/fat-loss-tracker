import { useState, useMemo } from 'react';
import { Activity, Edit3, X, ChevronDown, ChevronUp, Dumbbell } from 'lucide-react';
import { useApp } from '../context/AppContext';
import DateNavigator from './DateNavigator';
import { exerciseDatabase, adjustCaloriesBurn } from '../utils/foodDatabase';
import { formatDate } from '../utils/calculations';
import { getRecentEntries } from '../utils/tracking';
import EmptyState from './EmptyState';
import { useToast } from './Toast';
import { Modal, ModalActions, QuickValueButtons, FormField, inputStyle } from './ui';

const ExerciseLogger = ({ selectedDate, onDateChange }) => {
  const { state, dispatch } = useApp();
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExerciseId, setEditingExerciseId] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [duration, setDuration] = useState(30);
  const [manualExercise, setManualExercise] = useState({
    name: '',
    duration: '',
    calories: '',
    category: '其他',
    time: ''
  });

  const showToast = useToast();

  const today = formatDate(new Date());
  const todayLogs = useMemo(() => state.dailyLogs[selectedDate]?.exercises || [], [selectedDate, state.dailyLogs]);
  const recentExercises = useMemo(() => getRecentEntries(state.dailyLogs, 'exercises', 4), [state.dailyLogs]);
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
    setEditingExerciseId(null);
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

    dispatch({ type: 'LOG_EXERCISE', payload: { date: selectedDate, exercise } });
    showToast(`已添加 ${exercise.name}`, 'success');
    closeAddModal();
  };

  const resetManualExercise = () => {
    setManualExercise({
      name: '',
      duration: '',
      calories: '',
      category: '其他',
      time: ''
    });
    setEditingExerciseId(null);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setSelectedExercise(null);
    setDuration(30);
    resetManualExercise();
  };

  const handleManualAdd = () => {
    if (!manualExercise.name || !manualExercise.calories || !manualExercise.duration) return;

    const exercise = {
      name: manualExercise.name,
      duration: parseInt(manualExercise.duration),
      calories: parseFloat(manualExercise.calories),
      category: manualExercise.category || '其他',
      time: manualExercise.time || new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    };

    if (editingExerciseId) {
      dispatch({ type: 'UPDATE_EXERCISE', payload: { date: selectedDate, id: editingExerciseId, exercise } });
      showToast(`已更新 ${exercise.name}`, 'success');
    } else {
      dispatch({ type: 'LOG_EXERCISE', payload: { date: selectedDate, exercise } });
      showToast(`已添加 ${exercise.name}`, 'success');
    }

    closeAddModal();
  };

  const handleDeleteExercise = (id) => {
    const exercise = todayLogs.find(e => e.id === id);
    dispatch({ type: 'REMOVE_EXERCISE', payload: { date: selectedDate, id } });
    showToast({
      message: `已删除 ${exercise?.name || '运动'}`,
      type: 'success',
      duration: 4000,
      actionLabel: '撤销',
      onAction: () => {
        if (exercise) dispatch({ type: 'RESTORE_EXERCISE', payload: { date: selectedDate, exercise } });
      },
    });
  };

  const handleEditExercise = (exercise) => {
    setSelectedExercise(null);
    setEditingExerciseId(exercise.id);
    setManualExercise({
      name: exercise.name || '',
      duration: exercise.duration || '',
      calories: exercise.calories || '',
      category: exercise.category || '其他',
      time: exercise.time || ''
    });
    setShowAddModal(true);
  };

  const toggleCategory = (category) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const handleQuickAddExercise = (item) => {
    dispatch({
      type: 'LOG_EXERCISE',
      payload: {
        date: selectedDate,
        exercise: {
          ...item,
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        }
      }
    });
    showToast(`已添加 ${item.name}`, 'success');
  };

  return (
    <div style={styles.container}>
      <DateNavigator selectedDate={selectedDate} onChange={onDateChange} />

      {recentExercises.length > 0 && (
        <div style={styles.quickSection}>
          <div style={styles.quickHeader}>最近常练</div>
          <div style={styles.quickList}>
            {recentExercises.map((item) => (
              <button
                key={item.name}
                type="button"
                style={styles.quickChip}
                className="btn-interactive"
                onClick={() => handleQuickAddExercise(item)}
              >
                <span>{item.name}</span>
                <span style={styles.quickMeta}>{Math.round(item.calories)} kcal</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 运动类型选择 */}
      <div style={styles.categoriesSection}>
        <div style={styles.header}>
          <h3 style={styles.sectionTitle}>选择运动类型</h3>
          <button
            type="button"
            onClick={() => {
              setSelectedExercise(null);
              resetManualExercise();
              setShowAddModal(true);
            }}
            style={styles.manualButton}
            className="btn-interactive"
            aria-label="手动输入运动"
          >
            <Edit3 size={16} />
            <span style={{ marginLeft: '6px' }}>手动输入</span>
          </button>
        </div>

        {categories.map((category) => (
          <div key={category} style={styles.categoryCard}>
            <button
              type="button"
              style={styles.categoryHeader}
              onClick={() => toggleCategory(category)}
              aria-expanded={expandedCategory === category}
              aria-label={`${category} 分类，${expandedCategory === category ? '收起' : '展开'}`}
            >
              <div style={styles.categoryTitleRow}>
                <Activity size={18} style={{ color: 'var(--accent)' }} />
                <span style={styles.categoryTitle}>{category}</span>
                <span style={styles.categoryCount}>
                  {groupedExercises[category].length}项
                </span>
              </div>
              {expandedCategory === category ? (
                <ChevronUp size={20} style={{ color: 'var(--text-secondary)' }} />
              ) : (
                <ChevronDown size={20} style={{ color: 'var(--text-secondary)' }} />
              )}
            </button>

            {expandedCategory === category && (
              <div style={styles.exerciseList}>
                {groupedExercises[category].map((exercise, index) => (
                  <button
                    type="button"
                    key={index}
                    style={styles.exerciseItem}
                    className="btn-interactive"
                    onClick={() => handleExerciseSelect(exercise, category)}
                    aria-label={`添加运动 ${exercise.name}`}
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
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 今日记录 */}
      <div style={styles.todaySection}>
        <h3 style={styles.sectionTitle}>{selectedDate === today ? '今日已记录' : '当日已记录'}</h3>
        {todayLogs.length === 0 ? (
          <EmptyState
            icon={Dumbbell}
            title="还没有记录今日运动"
            description="选择运动类型开始记录"
          />
        ) : (
          <div style={styles.logsList}>
            {todayLogs.map((exercise) => (
              <div key={exercise.id} style={{ ...styles.logItem, animation: 'slideInRight 0.25s ease' }}>
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
                <div style={styles.logActions}>
                  <button
                    type="button"
                    onClick={() => handleEditExercise(exercise)}
                    style={styles.editButton}
                    className="btn-interactive"
                    aria-label={`编辑运动 ${exercise.name}`}
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteExercise(exercise.id)}
                    style={styles.deleteButton}
                    className="btn-interactive"
                    aria-label={`删除运动 ${exercise.name}`}
                  >
                    <X size={16} />
                  </button>
                </div>
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
      <Modal
        isOpen={showAddModal}
        onClose={closeAddModal}
        title={selectedExercise ? selectedExercise.name : (editingExerciseId ? '编辑运动' : '手动输入运动')}
      >
        {selectedExercise ? (
          <>
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

              <FormField label="运动时长（分钟）">
                <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                  <input
                    type="number"
                    inputMode="numeric"
                    enterKeyHint="done"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    style={{ ...inputStyle, marginTop: 0, flex: 1 }}
                    autoFocus
                  />
                  <QuickValueButtons values={[15, 30, 45, 60]} onSelect={setDuration} />
                </div>
              </FormField>

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
            <ModalActions
              onCancel={closeAddModal}
              onConfirm={handleAddExercise}
              confirmText="添加"
            />
          </>
        ) : (
          <>
            <div style={styles.modalContent}>
              <FormField label="运动名称" required>
                <input
                  type="text"
                  value={manualExercise.name}
                  onChange={(e) => setManualExercise({ ...manualExercise, name: e.target.value })}
                  style={inputStyle}
                  placeholder="例：篮球"
                />
              </FormField>
              <FormField label="时长（分钟）" required>
                <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                  <input
                    type="number"
                    inputMode="numeric"
                    enterKeyHint="next"
                    value={manualExercise.duration}
                    onChange={(e) => setManualExercise({ ...manualExercise, duration: e.target.value })}
                    style={{ ...inputStyle, marginTop: 0, flex: 1 }}
                    placeholder="例：60"
                  />
                  <QuickValueButtons
                    values={[15, 30, 45, 60]}
                    onSelect={(v) => setManualExercise({ ...manualExercise, duration: v.toString() })}
                  />
                </div>
              </FormField>
              <FormField label="消耗热量（千卡）" required>
                <input
                  type="number"
                  inputMode="numeric"
                  enterKeyHint="done"
                  value={manualExercise.calories}
                  onChange={(e) => setManualExercise({ ...manualExercise, calories: e.target.value })}
                  style={inputStyle}
                  placeholder="例：300"
                />
              </FormField>
              <FormField label="分类">
                <input
                  type="text"
                  value={manualExercise.category}
                  onChange={(e) => setManualExercise({ ...manualExercise, category: e.target.value })}
                  style={inputStyle}
                  placeholder="例：有氧运动"
                />
              </FormField>
            </div>
            <ModalActions
              onCancel={closeAddModal}
              onConfirm={handleManualAdd}
              confirmText={editingExerciseId ? '保存' : '添加'}
            />
          </>
        )}
      </Modal>
    </div>
  );
};

const styles = {
  container: {
    padding: 'var(--space-lg)',
    maxWidth: '800px',
    margin: '0 auto'
  },
  quickSection: {
    marginBottom: 'var(--space-lg)'
  },
  quickHeader: {
    fontSize: 'var(--text-base)',
    fontWeight: '600',
    color: 'var(--text-muted)',
    marginBottom: 'var(--space-sm)'
  },
  quickList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--space-sm)'
  },
  quickChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    border: '1px solid var(--border)',
    background: 'var(--bg-tertiary)',
    color: 'var(--text-heading)',
    borderRadius: 'var(--radius-full)',
    padding: 'var(--space-sm) var(--space-md)',
    cursor: 'pointer',
    fontSize: 'var(--text-sm)'
  },
  quickMeta: {
    color: 'var(--text-secondary)',
    fontSize: 'var(--text-xs)'
  },
  categoriesSection: {
    marginBottom: 'var(--space-lg)'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 'var(--space-md)'
  },
  sectionTitle: {
    fontSize: 'var(--text-lg)',
    fontWeight: '600',
    color: 'var(--text-heading)',
    margin: 0
  },
  manualButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: '7.5px',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-base)',
    fontWeight: '400',
    cursor: 'pointer',
    transition: 'background 200ms ease'
  },
  categoryCard: {
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-base)',
    marginBottom: 'var(--space-sm)',
    overflow: 'hidden'
  },
  categoryHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '14px',
    cursor: 'pointer',
    transition: 'background var(--duration-base)',
    background: 'transparent',
    border: 'none',
    textAlign: 'left'
  },
  categoryTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    flex: 1
  },
  categoryTitle: {
    fontSize: 'var(--text-md)',
    fontWeight: '500',
    color: 'var(--text-heading)'
  },
  categoryCount: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-muted)',
    marginLeft: 'auto',
    marginRight: 'var(--space-md)'
  },
  exerciseList: {
    borderTop: '1px solid var(--border)'
  },
  exerciseItem: {
    width: '100%',
    padding: 'var(--space-md) 14px',
    borderBottom: '1px solid var(--border)',
    cursor: 'pointer',
    transition: 'background var(--duration-base)',
    background: 'transparent',
    borderLeft: 'none',
    borderRight: 'none',
    borderTop: 'none',
    textAlign: 'left'
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
    fontSize: 'var(--text-base)',
    fontWeight: '500',
    color: 'var(--text-heading)'
  },
  impactBadge: {
    padding: '2px var(--space-sm)',
    borderRadius: '4px',
    fontSize: 'var(--text-xs)',
    fontWeight: '500',
    color: '#fff'
  },
  exerciseInfo: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 'var(--text-sm)',
    color: 'var(--text-secondary)'
  },
  divider: {
    margin: '0 var(--space-sm)',
    color: 'var(--border-divider)'
  },
  todaySection: {
    marginBottom: 'var(--space-lg)'
  },
  logsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-sm)'
  },
  logItem: {
    display: 'flex',
    alignItems: 'center',
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-base)',
    padding: 'var(--space-md)',
    transition: 'background var(--duration-base)'
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
    fontSize: 'var(--text-md)',
    fontWeight: '500',
    color: 'var(--text-heading)'
  },
  logTime: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-muted)'
  },
  logInfo: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 'var(--text-sm)',
    color: 'var(--text-secondary)'
  },
  logCategory: {
    color: 'var(--accent)'
  },
  logCalories: {
    color: 'var(--success)',
    fontWeight: '500'
  },
  deleteButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '44px',
    minHeight: '44px',
    width: '44px',
    height: '44px',
    background: 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    transition: 'all var(--duration-base)',
    marginLeft: 'var(--space-sm)'
  },
  editButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '44px',
    minHeight: '44px',
    width: '44px',
    height: '44px',
    background: 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--accent)',
    cursor: 'pointer',
    transition: 'all var(--duration-base)',
    marginLeft: 'var(--space-sm)'
  },
  logActions: {
    display: 'flex',
    alignItems: 'center'
  },
  summary: {
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-lg)'
  },
  summaryContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  summaryLabel: {
    fontSize: 'var(--text-lg)',
    fontWeight: '500',
    color: 'var(--text-secondary)'
  },
  summaryValue: {
    fontSize: 'var(--text-4xl)',
    fontWeight: '700',
    color: 'var(--success)'
  },
  modalContent: {
    marginBottom: 'var(--space-lg)'
  },
  exerciseDetails: {
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-base)',
    padding: 'var(--space-md)',
    marginBottom: 'var(--space-base)'
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--space-sm) 0'
  },
  detailLabel: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-secondary)'
  },
  detailValue: {
    fontSize: 'var(--text-base)',
    fontWeight: '500',
    color: 'var(--text-heading)'
  },
  description: {
    marginTop: 'var(--space-sm)',
    paddingTop: 'var(--space-sm)',
    borderTop: '1px solid var(--border)',
    fontSize: 'var(--text-sm)',
    color: 'var(--text-secondary)',
    lineHeight: '1.5'
  },
  caloriesPreview: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--space-base)',
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-base)',
    marginBottom: 'var(--space-sm)'
  },
  previewLabel: {
    fontSize: 'var(--text-base)',
    color: 'var(--text-secondary)'
  },
  previewValue: {
    fontSize: 'var(--text-3xl)',
    fontWeight: '700',
    color: 'var(--success)'
  },
  hint: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-muted)',
    textAlign: 'center',
    fontStyle: 'italic'
  }
};

export default ExerciseLogger;
