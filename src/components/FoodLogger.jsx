import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Sparkles, X, Edit3, Utensils, Loader } from 'lucide-react';
import { useApp } from '../context/AppContext';
import DateNavigator from './DateNavigator';
import { searchFood, foodDatabase } from '../utils/foodDatabase';
import { formatDate, toDate } from '../utils/calculations';
import { requestAIJson } from '../utils/ai';
import EmptyState from './EmptyState';
import ModalShell from './ModalShell';
import { useToast } from './Toast';

const FoodLogger = ({ selectedDate, onDateChange }) => {
  const { state, dispatch } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [editingFoodId, setEditingFoodId] = useState(null);
  const [selectedFood, setSelectedFood] = useState(null);
  const [grams, setGrams] = useState(100);
  const [aiInput, setAiInput] = useState('');
  const [manualFood, setManualFood] = useState({
    name: '',
    grams: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    time: ''
  });

  const showToast = useToast();
  const searchInputRef = useRef(null);

  const today = formatDate(new Date());
  const todayLogs = useMemo(() => state.dailyLogs[selectedDate]?.foods || [], [selectedDate, state.dailyLogs]);

  // 提取最近7天高频食物top5
  const frequentFoods = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const foodCount = {};
    Object.keys(state.dailyLogs).forEach(date => {
      const logDate = toDate(date);
      if (logDate >= sevenDaysAgo) {
        const foods = state.dailyLogs[date]?.foods || [];
        foods.forEach(food => {
          const key = food.name;
          if (!foodCount[key]) {
            foodCount[key] = { count: 0, lastEntry: food };
          }
          foodCount[key].count++;
          foodCount[key].lastEntry = food;
        });
      }
    });

    return Object.values(foodCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(item => item.lastEntry);
  }, [state.dailyLogs]);

  // 搜索防抖 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchResults = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return [];
    return searchFood(debouncedSearchQuery);
  }, [debouncedSearchQuery]);

  const todayTotals = useMemo(() => {
    return todayLogs.reduce((acc, food) => ({
      calories: acc.calories + (food.calories || 0),
      protein: acc.protein + (food.protein || 0),
      carbs: acc.carbs + (food.carbs || 0),
      fat: acc.fat + (food.fat || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [todayLogs]);

  const getCategoryColor = (category) => {
    const colors = {
      '蔬菜': '#2ecc71',
      '水果': '#e74c3c',
      '肉类': '#e67e22',
      '主食': '#f39c12',
      '乳制品': '#3498db',
      '零食': '#9b59b6',
      '饮料': '#1abc9c',
      '调味品': '#95a5a6',
      '坚果': '#d35400',
      '豆制品': '#16a085'
    };
    return colors[category] || '#7f8c8d';
  };

  const handleFoodSelect = (food) => {
    setEditingFoodId(null);
    setSelectedFood(food);
    setGrams(100);
    setShowAddModal(true);
  };

  const calculateNutrition = (baseValue, grams) => {
    return ((baseValue * grams) / 100).toFixed(1);
  };

  const handleAddFood = () => {
    if (!selectedFood) return;

    const food = {
      name: selectedFood.name,
      grams: parseInt(grams),
      calories: parseFloat(calculateNutrition(selectedFood.calories, grams)),
      protein: parseFloat(calculateNutrition(selectedFood.protein, grams)),
      carbs: parseFloat(calculateNutrition(selectedFood.carbs, grams)),
      fat: parseFloat(calculateNutrition(selectedFood.fat, grams)),
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    };

    dispatch({ type: 'LOG_FOOD', payload: { date: selectedDate, food } });
    showToast(`已添加 ${food.name}`, 'success');
    closeAddModal();
    setSearchQuery('');
  };

  const resetManualFood = () => {
    setManualFood({
      name: '',
      grams: '',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
      time: ''
    });
    setEditingFoodId(null);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setSelectedFood(null);
    setGrams(100);
    resetManualFood();
  };

  const handleManualAdd = () => {
    if (!manualFood.name || !manualFood.calories) return;

    const food = {
      name: manualFood.name,
      grams: parseFloat(manualFood.grams) || 0,
      calories: parseFloat(manualFood.calories),
      protein: parseFloat(manualFood.protein) || 0,
      carbs: parseFloat(manualFood.carbs) || 0,
      fat: parseFloat(manualFood.fat) || 0,
      time: manualFood.time || new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    };

    if (editingFoodId) {
      dispatch({ type: 'UPDATE_FOOD', payload: { date: selectedDate, id: editingFoodId, food } });
      showToast(`已更新 ${food.name}`, 'success');
    } else {
      dispatch({ type: 'LOG_FOOD', payload: { date: selectedDate, food } });
      showToast(`已添加 ${food.name}`, 'success');
    }

    closeAddModal();
  };

  // 去除食物名称中的括号注释，用于模糊匹配
  const stripParens = (name) => name.replace(/[（(][^）)]*[）)]/g, '').trim();

  const parseAIInput = (text) => {
    const quantityPatterns = [
      { pattern: '三碗', grams: 600 }, { pattern: '两碗', grams: 400 },
      { pattern: '一碗', grams: 200 }, { pattern: '半碗', grams: 100 },
      { pattern: '三份', grams: 450 }, { pattern: '两份', grams: 300 },
      { pattern: '一份', grams: 150 }, { pattern: '半份', grams: 75 },
      { pattern: '三个', grams: 150 }, { pattern: '两个', grams: 100 },
      { pattern: '一个', grams: 50 }, { pattern: '半个', grams: 25 },
      { pattern: '三杯', grams: 750 }, { pattern: '两杯', grams: 500 },
      { pattern: '一杯', grams: 250 }, { pattern: '半杯', grams: 125 },
      { pattern: '一块', grams: 80 }, { pattern: '两块', grams: 160 },
      { pattern: '一盘', grams: 200 }, { pattern: '两盘', grams: 400 },
      { pattern: '一根', grams: 60 }, { pattern: '两根', grams: 120 },
      { pattern: '一片', grams: 30 }, { pattern: '两片', grams: 60 },
      { pattern: '一把', grams: 30 }, { pattern: '一勺', grams: 15 },
    ];

    // 按逗号、顿号、加号、和、以及空格分割多个食物
    const segments = text.split(/[，,、+\s]+/).filter(Boolean);
    const results = [];
    const matched = new Set();

    for (const segment of segments) {
      let bestMatch = null;
      let bestMatchLen = 0;
      let segGrams = null;

      // 尝试匹配 "数字+g/克" 的格式，如 "200g鸡胸肉"、"150克米饭"
      const gramMatch = segment.match(/(\d+)\s*[gG克]/);
      if (gramMatch) segGrams = parseInt(gramMatch[1]);

      // 尝试匹配量词
      if (!segGrams) {
        for (const { pattern, grams } of quantityPatterns) {
          if (segment.includes(pattern)) {
            segGrams = grams;
            break;
          }
        }
      }

      // 在食物库中模糊匹配
      for (const food of foodDatabase) {
        const baseName = stripParens(food.name);
        // 双向匹配：输入包含食物名 OR 食物名包含输入关键词
        const segClean = segment.replace(/[\d\s]+[gG克]/, '').replace(/[一二三四五六七八九十两半]?[碗份个杯块盘根片把勺]/, '').trim();
        if (segClean && (segment.includes(baseName) || baseName.includes(segClean)) && segClean.length >= 1) {
          // 优先选择匹配长度最长的（更精确的匹配）
          if (baseName.length > bestMatchLen && !matched.has(food.name)) {
            bestMatch = food;
            bestMatchLen = baseName.length;
          }
        }
      }

      if (bestMatch) {
        matched.add(bestMatch.name);
        results.push({
          ...bestMatch,
          grams: segGrams || bestMatch.defaultGrams || 100,
        });
      }
    }

    return results;
  };

  const [aiResults, setAiResults] = useState([]);
  const [aiError, setAiError] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const aiSettings = state.aiSettings || {};
  const hasAI = !!(aiSettings.apiKey && aiSettings.selectedModel);

  const normalizeAIItem = (item, fromAI) => ({
    name: item.name || '',
    grams: Math.round(item.grams || 0),
    calories: Math.round(item.calories || 0),
    protein: Math.round(item.protein || 0),
    carbs: Math.round(item.carbs || 0),
    fat: Math.round(item.fat || 0),
    fromAI,
  });

  const updateAIResult = (index, field, value) => {
    setAiResults((prev) => prev.map((item, itemIndex) => {
      if (itemIndex !== index) return item;

      const normalizedValue = field === 'name'
        ? value
        : value === ''
          ? ''
          : Number(value);

      return {
        ...item,
        [field]: normalizedValue,
      };
    }));
  };

  const removeAIResult = (index) => {
    setAiResults((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleAIRecognition = async () => {
    if (!aiInput.trim()) return;

    setAiLoading(true);
    setAiError('');
    setAiResults([]);

    if (hasAI) {
      try {
        const items = await requestAIJson({
          apiKey: aiSettings.apiKey,
          model: aiSettings.selectedModel,
          responseType: 'array',
          systemPrompt: `你是一个食物营养分析助手。用户会告诉你他吃了什么，你需要分析每种食物并返回JSON数组。
每个元素格式：{"name":"食物名","grams":克数,"calories":总热量kcal,"protein":蛋白质g,"carbs":碳水g,"fat":脂肪g}
注意：calories/protein/carbs/fat是该份量的总量，不是每100g的值。
只返回JSON数组，不要有其他文字。`,
          userPrompt: aiInput,
        });

        if (!Array.isArray(items) || items.length === 0) {
          setAiError('AI 未能识别食物，请重新描述');
        } else {
          setAiResults(items.map((item) => normalizeAIItem(item, true)));
        }
      } catch (e) {
        setAiError(`AI 识别失败: ${e.message}`);
      } finally {
        setAiLoading(false);
      }
    } else {
      // 本地匹配 fallback
      const recognized = parseAIInput(aiInput);
      if (recognized.length === 0) {
        setAiError('未识别到食物。配置 AI 设置可识别任意食物，或使用"一碗米饭"等格式匹配本地数据库');
        setAiLoading(false);
        return;
      }

      setAiResults(recognized.map((item) => normalizeAIItem({
        name: stripParens(item.name),
        grams: item.grams,
        calories: parseFloat(calculateNutrition(item.calories, item.grams)),
        protein: parseFloat(calculateNutrition(item.protein, item.grams)),
        carbs: parseFloat(calculateNutrition(item.carbs, item.grams)),
        fat: parseFloat(calculateNutrition(item.fat, item.grams)),
      }, false)));
      setAiLoading(false);
    }
  };

  const handleConfirmAIResults = () => {
    aiResults.forEach(item => {
      const food = {
        name: item.name,
        grams: Number(item.grams) || 0,
        calories: Number(item.calories) || 0,
        protein: Number(item.protein) || 0,
        carbs: Number(item.carbs) || 0,
        fat: Number(item.fat) || 0,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      };
      dispatch({ type: 'LOG_FOOD', payload: { date: selectedDate, food } });
    });
    showToast(`已添加 ${aiResults.length} 项食物`, 'success');
    setShowAIModal(false);
    setAiInput('');
    setAiResults([]);
    setAiError('');
  };

  const handleDeleteFood = (id) => {
    const food = todayLogs.find(f => f.id === id);
    if (!food) return;

    dispatch({ type: 'REMOVE_FOOD', payload: { date: selectedDate, id } });
    showToast({
      message: `已删除 ${food.name}`,
      type: 'info',
      duration: 4000,
      actionLabel: '撤销',
      onAction: () => {
        dispatch({ type: 'RESTORE_FOOD', payload: { date: selectedDate, food } });
      },
    });
  };

  const handleEditFood = (food) => {
    setSelectedFood(null);
    setEditingFoodId(food.id);
    setManualFood({
      name: food.name || '',
      grams: food.grams || '',
      calories: food.calories || '',
      protein: food.protein || '',
      carbs: food.carbs || '',
      fat: food.fat || '',
      time: food.time || ''
    });
    setShowAddModal(true);
  };

  const handleQuickAddFood = (item) => {
    dispatch({
      type: 'LOG_FOOD',
      payload: {
        date: selectedDate,
        food: {
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

      {frequentFoods.length > 0 && (
        <div style={styles.quickSection}>
          <div style={styles.quickHeader}>最近常吃</div>
          <div style={styles.quickList}>
            {frequentFoods.map((item, idx) => (
              <button
                key={`${item.name}-${idx}`}
                type="button"
                style={styles.quickChip}
                className="btn-interactive"
                onClick={() => handleQuickAddFood(item)}
              >
                <span>{item.name}</span>
                <span style={styles.quickMeta}>{Math.round(item.calories)} kcal</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 搜索区域 */}
      <div style={styles.searchSection}>
        <div style={styles.searchBox}>
          <Search size={20} style={styles.searchIcon} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="搜索食物..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
            aria-label="搜索食物"
          />
        </div>

        <div style={styles.actionButtons}>
          <button
            type="button"
            onClick={() => setShowAIModal(true)}
            style={styles.aiButton}
            className="btn-interactive"
            disabled={aiLoading}
            aria-label="打开 AI 食物识别"
          >
            {aiLoading ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={18} />}
            <span style={{ marginLeft: '6px' }}>{aiLoading ? 'AI识别中...' : 'AI识别'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedFood(null);
              resetManualFood();
              setShowAddModal(true);
            }}
            style={styles.manualButton}
            className="btn-interactive"
            aria-label="手动输入食物"
          >
            <Edit3 size={18} />
            <span style={{ marginLeft: '6px' }}>手动输入</span>
          </button>
        </div>
      </div>

      {/* 搜索结果 */}
      {searchResults.length > 0 && (
        <div style={styles.searchResults}>
          {searchResults.map((food, index) => (
            <button
              type="button"
              key={index}
              onClick={() => handleFoodSelect(food)}
              style={styles.foodCard}
              className="card-hover"
              aria-label={`添加食物 ${food.name}`}
            >
              <div style={{ ...styles.categoryBar, background: getCategoryColor(food.category) }} />
              <div style={styles.foodContent}>
                <div style={styles.foodHeader}>
                  <h4 style={styles.foodName}>{food.name}</h4>
                  <span style={styles.categoryBadge}>{food.category}</span>
                </div>
                <div style={styles.foodNutrition}>
                  <span>{food.calories}千卡/100g</span>
                  <span style={styles.divider}>|</span>
                  <span>蛋白质 {food.protein}g</span>
                  <span style={styles.divider}>|</span>
                  <span>碳水 {food.carbs}g</span>
                  <span style={styles.divider}>|</span>
                  <span>脂肪 {food.fat}g</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 今日记录 */}
      <div style={styles.todaySection}>
        <h3 style={styles.sectionTitle}>{selectedDate === today ? '今日已记录' : '当日已记录'}</h3>
        {todayLogs.length === 0 ? (
          <EmptyState
            icon={Utensils}
            title="还没有记录今日饮食"
            description="搜索食物或使用 AI 识别来开始记录"
            actionLabel="搜索食物"
            onAction={() => searchInputRef.current?.focus()}
          />
        ) : (
          <div style={styles.logsList}>
            {todayLogs.map((food) => (
              <div key={food.id} style={{ ...styles.logItem, animation: 'slideInRight 0.25s ease' }}>
                <div style={styles.logContent}>
                  <div style={styles.logHeader}>
                    <span style={styles.logName}>{food.name}</span>
                    <span style={styles.logTime}>{food.time}</span>
                  </div>
                  <div style={styles.logNutrition}>
                    {food.grams > 0 && <span>{food.grams}g | </span>}
                    <span style={styles.logCalories}>{food.calories}千卡</span>
                    <span style={styles.divider}>|</span>
                    <span>蛋白 {food.protein}g</span>
                    <span style={styles.divider}>|</span>
                    <span>碳水 {food.carbs}g</span>
                    <span style={styles.divider}>|</span>
                    <span>脂肪 {food.fat}g</span>
                  </div>
                </div>
                <div style={styles.logActions}>
                  <button
                    type="button"
                    onClick={() => handleEditFood(food)}
                    style={styles.editButton}
                    className="btn-interactive"
                    aria-label={`编辑食物 ${food.name}`}
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteFood(food.id)}
                    style={styles.deleteButton}
                    className="btn-interactive"
                    aria-label={`删除食物 ${food.name}`}
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
        <h3 style={styles.summaryTitle}>今日汇总</h3>
        <div style={styles.summaryGrid}>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>总热量</span>
            <span style={styles.summaryValue}>{todayTotals.calories.toFixed(0)}千卡</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>蛋白质</span>
            <span style={styles.summaryValue}>{todayTotals.protein.toFixed(1)}g</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>碳水</span>
            <span style={styles.summaryValue}>{todayTotals.carbs.toFixed(1)}g</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>脂肪</span>
            <span style={styles.summaryValue}>{todayTotals.fat.toFixed(1)}g</span>
          </div>
        </div>
      </div>

      {/* 添加食物弹窗 */}
      {showAddModal && (
        <ModalShell
          isOpen={showAddModal}
          onClose={closeAddModal}
          title={selectedFood ? selectedFood.name : editingFoodId ? '编辑食物' : '手动输入食物'}
          maxWidth="500px"
        >
            {selectedFood ? (
              <>
                <div style={styles.modalContent}>
                  <label style={styles.label}>
                    <span>重量（克）</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="number"
                        value={grams}
                        onChange={(e) => setGrams(e.target.value)}
                        style={{ ...styles.input, marginTop: 0, flex: 1 }}
                        autoFocus
                      />
                      {[50, 100, 150, 200].map(g => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGrams(g)}
                          style={styles.quickGramButton}
                          className="btn-interactive"
                        >
                          {g}g
                        </button>
                      ))}
                    </div>
                  </label>
                  <div style={styles.nutritionPreview}>
                    <div style={styles.previewItem}>
                      <span>热量</span>
                      <span style={styles.previewValue}>
                        {calculateNutrition(selectedFood.calories, grams)}千卡
                      </span>
                    </div>
                    <div style={styles.previewItem}>
                      <span>蛋白质</span>
                      <span style={styles.previewValue}>
                        {calculateNutrition(selectedFood.protein, grams)}g
                      </span>
                    </div>
                    <div style={styles.previewItem}>
                      <span>碳水</span>
                      <span style={styles.previewValue}>
                        {calculateNutrition(selectedFood.carbs, grams)}g
                      </span>
                    </div>
                    <div style={styles.previewItem}>
                      <span>脂肪</span>
                      <span style={styles.previewValue}>
                        {calculateNutrition(selectedFood.fat, grams)}g
                      </span>
                    </div>
                  </div>
                </div>
                <div style={styles.modalActions}>
                  <button type="button" onClick={closeAddModal} style={styles.cancelButton}>
                    取消
                  </button>
                  <button type="button" onClick={handleAddFood} style={styles.confirmButton}>
                    添加
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={styles.modalContent}>
                  <label style={styles.label}>
                    <span>食物名称*</span>
                    <input
                      type="text"
                      value={manualFood.name}
                      onChange={(e) => setManualFood({ ...manualFood, name: e.target.value })}
                      style={styles.input}
                      placeholder="例：鸡胸肉"
                    />
                  </label>
                  <label style={styles.label}>
                    <span>重量（克）</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="number"
                        value={manualFood.grams}
                        onChange={(e) => setManualFood({ ...manualFood, grams: e.target.value })}
                        style={{ ...styles.input, marginTop: 0, flex: 1 }}
                        placeholder="例：150"
                      />
                      {[50, 100, 150, 200].map(g => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setManualFood({ ...manualFood, grams: g.toString() })}
                          style={styles.quickGramButton}
                          className="btn-interactive"
                        >
                          {g}g
                        </button>
                      ))}
                    </div>
                  </label>
                  <label style={styles.label}>
                    <span>热量（千卡）*</span>
                    <input
                      type="number"
                      value={manualFood.calories}
                      onChange={(e) => setManualFood({ ...manualFood, calories: e.target.value })}
                      style={styles.input}
                      placeholder="例：165"
                    />
                  </label>
                  <label style={styles.label}>
                    <span>蛋白质（克）</span>
                    <input
                      type="number"
                      value={manualFood.protein}
                      onChange={(e) => setManualFood({ ...manualFood, protein: e.target.value })}
                      style={styles.input}
                      placeholder="例：31"
                    />
                  </label>
                  <label style={styles.label}>
                    <span>碳水（克）</span>
                    <input
                      type="number"
                      value={manualFood.carbs}
                      onChange={(e) => setManualFood({ ...manualFood, carbs: e.target.value })}
                      style={styles.input}
                      placeholder="例：0"
                    />
                  </label>
                  <label style={styles.label}>
                    <span>脂肪（克）</span>
                    <input
                      type="number"
                      value={manualFood.fat}
                      onChange={(e) => setManualFood({ ...manualFood, fat: e.target.value })}
                      style={styles.input}
                      placeholder="例：3.6"
                    />
                  </label>
                </div>
                <div style={styles.modalActions}>
                  <button type="button" onClick={closeAddModal} style={styles.cancelButton}>
                    取消
                  </button>
                  <button type="button" onClick={handleManualAdd} style={styles.confirmButton}>
                    {editingFoodId ? '保存' : '添加'}
                  </button>
                </div>
              </>
            )}
        </ModalShell>
      )}

      {/* AI识别弹窗 */}
      {showAIModal && (
        <ModalShell
          isOpen={showAIModal}
          onClose={() => { setShowAIModal(false); setAiResults([]); setAiError(''); }}
          title="AI 智能识别"
          maxWidth="500px"
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{
                padding: '3px 10px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '600',
                background: hasAI ? 'var(--success-bg-badge)' : 'var(--warning-bg)',
                color: hasAI ? 'var(--success)' : 'var(--warning)',
              }}>
                {hasAI ? `AI: ${aiSettings.selectedModel.split('/').pop()}` : '本地匹配模式'}
              </span>
              {!hasAI && (
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  在设置中配置 API 可识别任意食物
                </span>
              )}
            </div>
            <div style={styles.modalContent}>
              <label style={styles.label}>
                <span>描述你吃了什么</span>
                <textarea
                  value={aiInput}
                  onChange={(e) => { setAiInput(e.target.value); setAiError(''); setAiResults([]); }}
                  style={styles.textarea}
                  placeholder={hasAI ? '随意描述，如：早上吃了煎饼果子加一杯豆浆' : '例：一碗米饭，200g鸡胸肉，一份西兰花'}
                  rows={3}
                  autoFocus
                />
              </label>
              {!hasAI && (
                <div style={styles.aiHint}>
                  支持量词：一碗/两碗/半碗、一份、一个、一杯、一盘等
                  <br />
                  支持克数：200g鸡胸肉、150克米饭
                  <br />
                  多个食物用逗号、空格或顿号分隔
                </div>
              )}
              {aiLoading && (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--accent)', fontSize: '14px' }}>
                  AI 正在分析中...
                </div>
              )}
              {aiError && (
                <div style={{ color: 'var(--danger)', fontSize: '13px', marginTop: '8px', padding: '8px 12px', background: 'var(--danger-bg)', borderRadius: '6px' }}>
                  {aiError}
                </div>
              )}
              {aiResults.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    识别到 {aiResults.length} 项食物，可在确认前直接修改：
                  </div>
                  {aiResults.map((item, i) => (
                    <div key={`${item.name}-${i}`} style={styles.aiResultCard}>
                      <div style={styles.aiResultHeader}>
                        <div>
                          <span style={{ color: 'var(--text-heading)', fontSize: '14px', fontWeight: '500' }}>{item.name || `食物 ${i + 1}`}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px', marginLeft: '8px' }}>{item.grams || 0}g</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAIResult(i)}
                          style={styles.aiResultDelete}
                          className="btn-interactive"
                          aria-label={`删除识别结果 ${item.name || i + 1}`}
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div style={styles.aiEditorGrid}>
                        <label style={styles.aiEditorField}>
                          <span>名称</span>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateAIResult(i, 'name', e.target.value)}
                            style={styles.input}
                          />
                        </label>
                        <label style={styles.aiEditorField}>
                          <span>克数</span>
                          <input
                            type="number"
                            value={item.grams}
                            onChange={(e) => updateAIResult(i, 'grams', e.target.value)}
                            style={styles.input}
                          />
                        </label>
                        <label style={styles.aiEditorField}>
                          <span>热量</span>
                          <input
                            type="number"
                            value={item.calories}
                            onChange={(e) => updateAIResult(i, 'calories', e.target.value)}
                            style={styles.input}
                          />
                        </label>
                        <label style={styles.aiEditorField}>
                          <span>蛋白</span>
                          <input
                            type="number"
                            value={item.protein}
                            onChange={(e) => updateAIResult(i, 'protein', e.target.value)}
                            style={styles.input}
                          />
                        </label>
                        <label style={styles.aiEditorField}>
                          <span>碳水</span>
                          <input
                            type="number"
                            value={item.carbs}
                            onChange={(e) => updateAIResult(i, 'carbs', e.target.value)}
                            style={styles.input}
                          />
                        </label>
                        <label style={styles.aiEditorField}>
                          <span>脂肪</span>
                          <input
                            type="number"
                            value={item.fat}
                            onChange={(e) => updateAIResult(i, 'fat', e.target.value)}
                            style={styles.input}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '14px', fontWeight: '600', color: 'var(--success)', marginTop: '4px', padding: '0 12px' }}>
                    合计：{aiResults.reduce((s, item) => s + (item.calories || 0), 0).toFixed(0)} kcal
                  </div>
                </div>
              )}
            </div>
            <div style={styles.modalActions}>
              <button type="button" onClick={() => { setShowAIModal(false); setAiResults([]); setAiError(''); }} style={styles.cancelButton}>
                取消
              </button>
              {aiResults.length === 0 ? (
                <button type="button" onClick={handleAIRecognition} style={styles.confirmButton} disabled={aiLoading}>
                  {aiLoading ? '分析中...' : '识别'}
                </button>
              ) : (
                <button type="button" onClick={handleConfirmAIResults} style={{ ...styles.confirmButton, background: 'var(--success)' }} disabled={aiResults.length === 0}>
                  确认添加
                </button>
              )}
            </div>
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
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    borderRadius: '999px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '13px'
  },
  quickMeta: {
    color: 'var(--text-nav)',
    fontSize: '12px'
  },
  searchSection: {
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
    padding: '12px 12px 12px 44px',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text-heading)',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.3s'
  },
  actionButtons: {
    display: 'flex',
    gap: '12px'
  },
  aiButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px',
    background: 'var(--ai-button-gradient)',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'opacity 0.3s'
  },
  manualButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text-heading)',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background 0.3s'
  },
  searchResults: {
    marginBottom: '20px'
  },
  foodCard: {
    display: 'flex',
    width: '100%',
    background: 'var(--bg-secondary)',
    borderRadius: '8px',
    marginBottom: '8px',
    cursor: 'pointer',
    overflow: 'hidden',
    transition: 'transform 0.2s',
    border: '1px solid var(--border)',
    padding: 0,
    textAlign: 'left'
  },
  categoryBar: {
    width: '4px',
    flexShrink: 0
  },
  foodContent: {
    flex: 1,
    padding: '12px'
  },
  foodHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px'
  },
  foodName: {
    margin: 0,
    fontSize: '15px',
    fontWeight: '500',
    color: 'var(--text-heading)'
  },
  categoryBadge: {
    padding: '2px 8px',
    background: 'var(--border)',
    borderRadius: '4px',
    fontSize: '12px',
    color: 'var(--text-secondary)'
  },
  foodNutrition: {
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
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--text-heading)',
    marginBottom: '12px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: 'var(--text-muted)',
    fontSize: '14px'
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
  logNutrition: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '13px',
    color: 'var(--text-secondary)'
  },
  logCalories: {
    color: 'var(--accent)',
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
    padding: '16px'
  },
  summaryTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--text-heading)',
    marginBottom: '12px'
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px'
  },
  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    padding: '12px',
    background: 'var(--bg-tertiary)',
    borderRadius: '8px'
  },
  summaryLabel: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginBottom: '4px'
  },
  summaryValue: {
    fontSize: '20px',
    fontWeight: '600',
    color: 'var(--accent)'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'var(--bg-overlay)',
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
  textarea: {
    marginTop: '6px',
    padding: '10px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    color: 'var(--text-heading)',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical'
  },
  nutritionPreview: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginTop: '16px',
    padding: '16px',
    background: 'var(--bg-secondary)',
    borderRadius: '8px'
  },
  previewItem: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: '13px',
    color: 'var(--text-secondary)'
  },
  previewValue: {
    marginTop: '4px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--text-heading)'
  },
  aiHint: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    marginTop: '8px',
    fontStyle: 'italic'
  },
  aiResultCard: {
    padding: '12px',
    background: 'var(--bg-secondary)',
    borderRadius: '10px',
    marginBottom: '10px',
    border: '1px solid var(--border)'
  },
  aiResultHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10px'
  },
  aiResultDelete: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: 'none',
    background: 'var(--danger-bg)',
    color: 'var(--danger)',
    cursor: 'pointer'
  },
  aiEditorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px'
  },
  aiEditorField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontSize: '12px',
    color: 'var(--text-secondary)'
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
  quickGramButton: {
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

export default FoodLogger;
