import { useState, useMemo } from 'react';
import { Activity, Edit3, X, ChevronDown, ChevronUp, Dumbbell, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import DateNavigator from './DateNavigator';
import { exerciseDatabase, adjustCaloriesBurn, searchExercise } from '../utils/foodDatabase';
import { formatDate } from '../utils/calculations';
import { getRecentEntries } from '../utils/tracking';
import EmptyState from './EmptyState';
import ModalShell from './ModalShell';
import { useToast } from './Toast';

const ExerciseLogger = ({ selectedDate, onDateChange }) => {
  const { state, dispatch } = useApp();
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
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
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchExercise(searchQuery).slice(0, 8);
  }, [searchQuery]);

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
    if (!exercise) return;

    dispatch({ type: 'REMOVE_EXERCISE', payload: { date: selectedDate, id } });
    showToast({
      message: `已删除 ${exercise.name}`,
      type: 'info',
      duration: 4000,
      actionLabel: '撤销',
      onAction: () => {
        dispatch({ type: 'RESTORE_EXERCISE', payload: { date: selectedDate, exercise } });
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

        <div style={styles.searchBox}>
          <Search size={18} style={styles.searchIcon} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索运动，例如：快走、骑车、力量"
            style={styles.searchInput}
            aria-label="搜索运动"
          />
        </div>

        {searchResults.length > 0 && (
          <div style={styles.searchResults}>
            {searchResults.map((exercise, index) => (
              <button
                type="button"
                key={`${exercise.name}-${index}`}
                style={styles.searchResultCard}
                className="btn-interactive"
                onClick={() => handleExerciseSelect(exercise, exercise.category)}
                aria-label={`添加运动 ${exercise.name}`}
              >
                <div style={styles.exerciseHeader}>
                  <span style={styles.exerciseName}>{exercise.name}</span>
                  <span
                    style={{
                      ...styles.impactBadge,
                      background: getJointImpactColor(exercise.jointImpact),
                    }}
                  >
                    {exercise.jointImpact}冲击
                  </span>
                </div>
                <div style={styles.exerciseInfo}>
                  <span>{exercise.category}</span>
                  <span style={styles.divider}>|</span>
                  <span>{exercise.caloriesPer30Min}千卡/30分钟</span>
                </div>
              </button>
            ))}
          </div>
        )}

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
      {showAddModal && (
        <ModalShell
          isOpen={showAddModal}
          onClose={closeAddModal}
          title={selectedExercise ? selectedExercise.name : editingExerciseId ? '编辑运动' : '手动输入运动'}
          maxWidth="500px"
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

                  <label style={styles.label}>
                    <span>运动时长（分钟）</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        style={{ ...styles.input, marginTop: 0, flex: 1 }}
                        autoFocus
                      />
                      {[15, 30, 45, 60].map(d => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDuration(d)}
                          style={styles.quickDurationButton}
                          className="btn-interactive"
                        >
                          {d}
                        </button>
                      ))}
                    </div>
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
                  <button type="button" onClick={closeAddModal} style={styles.cancelButton}>
                    取消
                  </button>
                  <button type="button" onClick={handleAddExercise} style={styles.confirmButton}>
                    添加
                  </button>
                </div>
              </>
            ) : (
              <>
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
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="number"
                        value={manualExercise.duration}
                        onChange={(e) => setManualExercise({ ...manualExercise, duration: e.target.value })}
                        style={{ ...styles.input, marginTop: 0, flex: 1 }}
                        placeholder="例：60"
                      />
                      {[15, 30, 45, 60].map(d => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setManualExercise({ ...manualExercise, duration: d.toString() })}
                          style={styles.quickDurationButton}
                          className="btn-interactive"
                        >
                          {d}
                        </button>
                      ))}
                    </div>
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
                  <label style={styles.label}>
                    <span>分类</span>
                    <input
                      type="text"
                      value={manualExercise.category}
                      onChange={(e) => setManualExercise({ ...manualExercise, category: e.target.value })}
                      style={styles.input}
                      placeholder="例：有氧运动"
                    />
                  </label>
                </div>
                <div style={styles.modalActions}>
                  <button type="button" onClick={closeAddModal} style={styles.cancelButton}>
                    取消
                  </button>
                  <button type="button" onClick={handleManualAdd} style={styles.confirmButton}>
                    {editingExerciseId ? '保存' : '添加'}
                  </button>
                </div>
              </>
            )}
        </ModalShell>
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
  quickSection: {
    marginBottom: '20px'
  },
  quickHeader: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text-muted)',
    marginBottom: '10px'
  },
  quickList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  quickChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    border: '1px solid var(--border)',
    background: 'var(--bg-tertiary)',
    color: 'var(--text-heading)',
    borderRadius: '999px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '13px'
  },
  quickMeta: {
    color: 'var(--text-secondary)',
    fontSize: '12px'
  },
  categoriesSection: {
    marginBottom: '20px'
  },
  searchBox: {
    position: 'relative',
    marginBottom: '12px'
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-muted)'
  },
  searchInput: {
    width: '100%',
    padding: '12px 12px 12px 40px',
    borderRadius: '10px',
    border: '1px solid var(--border)',
    background: 'var(--bg-tertiary)',
    color: 'var(--text-heading)',
    fontSize: '14px',
    outline: 'none'
  },
  searchResults: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '12px'
  },
  searchResultCard: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid var(--border)',
    background: 'var(--bg-secondary)',
    cursor: 'pointer',
    textAlign: 'left'
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
    color: 'var(--text-heading)',
    margin: 0
  },
  manualButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text-heading)',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background 0.3s'
  },
  categoryCard: {
    background: 'var(--bg-secondary)',
    borderRadius: '8px',
    marginBottom: '8px',
    overflow: 'hidden'
  },
  categoryHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '14px',
    cursor: 'pointer',
    transition: 'background 0.2s',
    background: 'transparent',
    border: 'none',
    textAlign: 'left'
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
    color: 'var(--text-heading)'
  },
  categoryCount: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    marginLeft: 'auto',
    marginRight: '12px'
  },
  exerciseList: {
    borderTop: '1px solid var(--border)'
  },
  exerciseItem: {
    width: '100%',
    padding: '12px 14px',
    borderBottom: '1px solid var(--border)',
    cursor: 'pointer',
    transition: 'background 0.2s',
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
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--text-heading)'
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
    color: 'var(--text-secondary)'
  },
  divider: {
    margin: '0 8px',
    color: 'var(--border-divider)'
  },
  todaySection: {
    marginBottom: '20px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: 'var(--text-muted)',
    fontSize: '14px',
    background: 'var(--bg-secondary)',
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
    background: 'var(--bg-secondary)',
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
    color: 'var(--text-heading)'
  },
  logTime: {
    fontSize: '12px',
    color: 'var(--text-muted)'
  },
  logInfo: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '13px',
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
    borderRadius: '6px',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginLeft: '8px'
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
    borderRadius: '6px',
    color: 'var(--accent)',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginLeft: '8px'
  },
  logActions: {
    display: 'flex',
    alignItems: 'center'
  },
  summary: {
    background: 'var(--bg-secondary)',
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
    color: 'var(--text-secondary)'
  },
  summaryValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: 'var(--success)'
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
    background: 'var(--bg-tertiary)',
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
    color: 'var(--text-heading)',
    marginBottom: '20px'
  },
  modalContent: {
    marginBottom: '20px'
  },
  exerciseDetails: {
    background: 'var(--bg-secondary)',
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
    color: 'var(--text-secondary)'
  },
  detailValue: {
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--text-heading)'
  },
  description: {
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid var(--border)',
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: '1.5'
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '16px',
    fontSize: '14px',
    color: 'var(--text-secondary)'
  },
  input: {
    marginTop: '6px',
    padding: '10px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    color: 'var(--text-heading)',
    fontSize: '14px',
    outline: 'none'
  },
  caloriesPreview: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    background: 'var(--bg-secondary)',
    borderRadius: '8px',
    marginBottom: '8px'
  },
  previewLabel: {
    fontSize: '14px',
    color: 'var(--text-secondary)'
  },
  previewValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: 'var(--success)'
  },
  hint: {
    fontSize: '12px',
    color: 'var(--text-muted)',
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
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text-heading)',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background 0.3s'
  },
  confirmButton: {
    flex: 1,
    padding: '12px',
    background: 'var(--accent)',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background 0.3s'
  },
  quickDurationButton: {
    padding: '8px 12px',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    color: 'var(--text-heading)',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    minWidth: '44px',
    minHeight: '44px',
    whiteSpace: 'nowrap'
  }
};

export default ExerciseLogger;
