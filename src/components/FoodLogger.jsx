import { useState, useMemo, useEffect, useRef, memo } from 'react';
import { Search, Sparkles, X, Edit3, Utensils, Loader } from 'lucide-react';
import { useApp } from '../context/AppContext';
import DateNavigator from './DateNavigator';
import { searchFood, foodDatabase } from '../utils/foodDatabase';
import { formatDate } from '../utils/calculations';
import { requestAIJson, getAIConfig, hasAIAvailable } from '../utils/ai';
import EmptyState from './EmptyState';
import { useToast } from './Toast';
import { Modal, ModalActions, QuickValueButtons, FormField, inputStyle, textareaStyle } from './ui';

// --- Sub-components ---

const FrequentFoods = memo(({ items, onQuickAdd }) => {
  if (items.length === 0) return null;
  return (
    <div style={styles.quickSection}>
      <div style={styles.quickHeader}>最近常吃</div>
      <div style={styles.quickList}>
        {items.map((item, idx) => (
          <button
            key={`${item.name}-${idx}`}
            type="button"
            style={styles.quickChip}
            className="btn-interactive"
            onClick={() => onQuickAdd(item)}
          >
            <span>{item.name}</span>
            <span style={styles.quickMeta}>{Math.round(item.calories)} kcal</span>
          </button>
        ))}
      </div>
    </div>
  );
});
FrequentFoods.displayName = 'FrequentFoods';

const categoryColors = {
  '蔬菜': '#2ecc71', '水果': '#e74c3c', '肉类': '#e67e22', '主食': '#f39c12',
  '乳制品': '#3498db', '零食': '#9b59b6', '饮料': '#1abc9c', '调味品': '#95a5a6',
  '坚果': '#d35400', '豆制品': '#16a085', '饮品': '#1abc9c',
};

const SearchResultCard = memo(({ food, onClick }) => (
  <button
    type="button"
    onClick={() => onClick(food)}
    style={styles.foodCard}
    className="card-hover"
    aria-label={`添加食物 ${food.name}`}
  >
    <div style={{ ...styles.categoryBar, background: categoryColors[food.category] || '#7f8c8d' }} />
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
));
SearchResultCard.displayName = 'SearchResultCard';

const FoodLogItem = memo(({ food, onEdit, onDelete }) => (
  <div style={{ ...styles.logItem, animation: 'slideInRight 0.25s ease' }}>
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
      <button type="button" onClick={() => onEdit(food)} style={styles.editButton} className="btn-interactive" aria-label={`编辑食物 ${food.name}`}>
        <Edit3 size={16} />
      </button>
      <button type="button" onClick={() => onDelete(food.id)} style={styles.deleteButton} className="btn-interactive" aria-label={`删除食物 ${food.name}`}>
        <X size={16} />
      </button>
    </div>
  </div>
));
FoodLogItem.displayName = 'FoodLogItem';

const NutritionSummary = memo(({ totals }) => (
  <div style={styles.summary}>
    <h3 style={styles.summaryTitle}>今日汇总</h3>
    <div style={styles.summaryGrid}>
      {[
        { label: '总热量', value: `${totals.calories.toFixed(0)}千卡` },
        { label: '蛋白质', value: `${totals.protein.toFixed(1)}g` },
        { label: '碳水', value: `${totals.carbs.toFixed(1)}g` },
        { label: '脂肪', value: `${totals.fat.toFixed(1)}g` },
      ].map(({ label, value }) => (
        <div key={label} style={styles.summaryItem}>
          <span style={styles.summaryLabel}>{label}</span>
          <span style={styles.summaryValue}>{value}</span>
        </div>
      ))}
    </div>
  </div>
));
NutritionSummary.displayName = 'NutritionSummary';

// --- AI / local parsing helpers ---

const stripParens = (name) => name.replace(/[（(][^）)]*[）)]/g, '').trim();

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

function parseAIInput(text) {
  const segments = text.split(/[，,、+\s]+/).filter(Boolean);
  const results = [];
  const matched = new Set();

  for (const segment of segments) {
    let bestMatch = null;
    let bestMatchLen = 0;
    let segGrams = null;

    const gramMatch = segment.match(/(\d+)\s*[gG克]/);
    if (gramMatch) segGrams = parseInt(gramMatch[1]);

    if (!segGrams) {
      for (const { pattern, grams } of quantityPatterns) {
        if (segment.includes(pattern)) { segGrams = grams; break; }
      }
    }

    for (const food of foodDatabase) {
      const baseName = stripParens(food.name);
      const segClean = segment.replace(/[\d\s]+[gG克]/, '').replace(/[一二三四五六七八九十两半]?[碗份个杯块盘根片把勺]/, '').trim();
      if (segClean && (segment.includes(baseName) || baseName.includes(segClean)) && segClean.length >= 1) {
        if (baseName.length > bestMatchLen && !matched.has(food.name)) {
          bestMatch = food;
          bestMatchLen = baseName.length;
        }
      }
    }

    if (bestMatch) {
      matched.add(bestMatch.name);
      results.push({ ...bestMatch, grams: segGrams || bestMatch.defaultGrams || 100 });
    }
  }
  return results;
}

function calculateNutrition(baseValue, grams) {
  return ((baseValue * grams) / 100).toFixed(1);
}

// --- Main component ---

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
  const [aiResults, setAiResults] = useState([]);
  const [aiError, setAiError] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [manualFood, setManualFood] = useState({ name: '', grams: '', calories: '', protein: '', carbs: '', fat: '', time: '' });

  const showToast = useToast();
  const searchInputRef = useRef(null);

  const today = formatDate(new Date());
  const todayLogs = useMemo(() => state.dailyLogs[selectedDate]?.foods || [], [selectedDate, state.dailyLogs]);

  const frequentFoods = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const foodCount = {};
    Object.keys(state.dailyLogs).forEach(date => {
      if (new Date(date) >= sevenDaysAgo) {
        (state.dailyLogs[date]?.foods || []).forEach(food => {
          const key = food.name;
          if (!foodCount[key]) foodCount[key] = { count: 0, lastEntry: food };
          foodCount[key].count++;
          foodCount[key].lastEntry = food;
        });
      }
    });
    return Object.values(foodCount).sort((a, b) => b.count - a.count).slice(0, 5).map(item => item.lastEntry);
  }, [state.dailyLogs]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
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
      fat: acc.fat + (food.fat || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [todayLogs]);

  const aiSettings = state.aiSettings || {};
  const aiConfig = getAIConfig(aiSettings);
  const hasAI = hasAIAvailable(aiSettings);

  const resetManualFood = () => {
    setManualFood({ name: '', grams: '', calories: '', protein: '', carbs: '', fat: '', time: '' });
    setEditingFoodId(null);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setSelectedFood(null);
    setGrams(100);
    resetManualFood();
  };

  const handleFoodSelect = (food) => {
    setEditingFoodId(null);
    setSelectedFood(food);
    setGrams(100);
    setShowAddModal(true);
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
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    };
    dispatch({ type: 'LOG_FOOD', payload: { date: selectedDate, food } });
    showToast(`已添加 ${food.name}`, 'success');
    closeAddModal();
    setSearchQuery('');
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
      time: manualFood.time || new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
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

  const handleDeleteFood = (id) => {
    const food = todayLogs.find(f => f.id === id);
    dispatch({ type: 'REMOVE_FOOD', payload: { date: selectedDate, id } });
    showToast({
      message: `已删除 ${food?.name || '食物'}`,
      type: 'success',
      duration: 4000,
      actionLabel: '撤销',
      onAction: () => {
        if (food) dispatch({ type: 'RESTORE_FOOD', payload: { date: selectedDate, food } });
      },
    });
  };

  const handleEditFood = (food) => {
    setSelectedFood(null);
    setEditingFoodId(food.id);
    setManualFood({
      name: food.name || '', grams: food.grams || '', calories: food.calories || '',
      protein: food.protein || '', carbs: food.carbs || '', fat: food.fat || '', time: food.time || '',
    });
    setShowAddModal(true);
  };

  const handleQuickAddFood = (item) => {
    dispatch({
      type: 'LOG_FOOD',
      payload: { date: selectedDate, food: { ...item, time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) } },
    });
    showToast(`已添加 ${item.name}`, 'success');
  };

  // --- AI Recognition ---

  const callAIAnalysis = async (text) => {
    const config = getAIConfig(aiSettings);
    if (!config) throw new Error('未配置 AI 服务');
    return requestAIJson({
      apiKey: config.key,
      model: config.model,
      url: config.url,
      responseType: 'array',
      systemPrompt: '你是一个食物营养分析助手。用户会告诉你他吃了什么，你需要分析每种食物并返回JSON数组。\n每个元素格式：{"name":"食物名","grams":克数,"calories":总热量kcal,"protein":蛋白质g,"carbs":碳水g,"fat":脂肪g}\n注意：calories/protein/carbs/fat是该份量的总量，不是每100g的值。\n只返回JSON数组，不要有其他文字。',
      userPrompt: text,
    });
  };

  const handleAIRecognition = async () => {
    if (!aiInput.trim()) return;
    if (hasAI) {
      setAiLoading(true); setAiError(''); setAiResults([]);
      try {
        const items = await callAIAnalysis(aiInput);
        if (!Array.isArray(items) || items.length === 0) {
          setAiError('AI 未能识别食物，请重新描述');
        } else {
          setAiResults(items.map(item => ({
            name: item.name, grams: item.grams || 100,
            calories: Math.round(item.calories || 0), protein: Math.round(item.protein || 0),
            carbs: Math.round(item.carbs || 0), fat: Math.round(item.fat || 0), fromAI: true,
          })));
        }
      } catch (e) { setAiError(`AI 识别失败: ${e.message}`); }
      setAiLoading(false);
    } else {
      const recognized = parseAIInput(aiInput);
      if (recognized.length === 0) {
        setAiError('未识别到食物。配置 AI 设置可识别任意食物，或使用"一碗米饭"等格式匹配本地数据库');
        setAiResults([]);
        return;
      }
      setAiError('');
      setAiResults(recognized.map(item => ({
        name: stripParens(item.name), grams: item.grams,
        calories: parseFloat(calculateNutrition(item.calories, item.grams)),
        protein: parseFloat(calculateNutrition(item.protein, item.grams)),
        carbs: parseFloat(calculateNutrition(item.carbs, item.grams)),
        fat: parseFloat(calculateNutrition(item.fat, item.grams)), fromAI: false,
      })));
    }
  };

  const handleConfirmAIResults = () => {
    aiResults.forEach(item => {
      dispatch({ type: 'LOG_FOOD', payload: { date: selectedDate, food: { ...item, time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) } } });
    });
    showToast(`已添加 ${aiResults.length} 项食物`, 'success');
    setShowAIModal(false); setAiInput(''); setAiResults([]); setAiError('');
  };

  const closeAIModal = () => { setShowAIModal(false); setAiResults([]); setAiError(''); };

  return (
    <div style={styles.container}>
      <DateNavigator selectedDate={selectedDate} onChange={onDateChange} />
      <FrequentFoods items={frequentFoods} onQuickAdd={handleQuickAddFood} />

      {/* Search area */}
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
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} style={styles.clearButton} aria-label="清空搜索">
              <X size={16} />
            </button>
          )}
        </div>
        <div style={styles.actionButtons}>
          <button type="button" onClick={() => setShowAIModal(true)} style={styles.aiButton} className="btn-interactive" disabled={aiLoading} aria-label="打开 AI 食物识别">
            {aiLoading ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={18} />}
            <span style={{ marginLeft: '6px' }}>{aiLoading ? 'AI识别中...' : 'AI识别'}</span>
          </button>
          <button type="button" onClick={() => { setSelectedFood(null); resetManualFood(); setShowAddModal(true); }} style={styles.manualButton} className="btn-interactive" aria-label="手动输入食物">
            <Edit3 size={18} />
            <span style={{ marginLeft: '6px' }}>手动输入</span>
          </button>
        </div>
      </div>

      {/* Search results */}
      {searchResults.length > 0 && (
        <div style={styles.searchResults}>
          {searchResults.map((food, index) => (
            <SearchResultCard key={index} food={food} onClick={handleFoodSelect} />
          ))}
        </div>
      )}

      {/* Today's logs */}
      <div style={styles.todaySection}>
        <h3 style={styles.sectionTitle}>{selectedDate === today ? '今日已记录' : '当日已记录'}</h3>
        {todayLogs.length === 0 ? (
          <EmptyState icon={Utensils} title="还没有记录今日饮食" description="搜索食物或使用 AI 识别来开始记录" actionLabel="搜索食物" onAction={() => searchInputRef.current?.focus()} />
        ) : (
          <div style={styles.logsList}>
            {todayLogs.map((food) => (
              <FoodLogItem key={food.id} food={food} onEdit={handleEditFood} onDelete={handleDeleteFood} />
            ))}
          </div>
        )}
      </div>

      <NutritionSummary totals={todayTotals} />

      {/* Add food modal */}
      <Modal isOpen={showAddModal} onClose={closeAddModal} title={selectedFood ? selectedFood.name : (editingFoodId ? '编辑食物' : '手动输入食物')}>
        {selectedFood ? (
          <>
            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <FormField label="重量（克）">
                <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                  <input type="number" value={grams} onChange={(e) => setGrams(e.target.value)} style={{ ...inputStyle, marginTop: 0, flex: 1 }} autoFocus min="0" max="5000" />
                  <QuickValueButtons values={[50, 100, 150, 200]} onSelect={setGrams} unit="g" selectedValue={parseInt(grams)} />
                </div>
              </FormField>
              <div style={styles.nutritionPreview}>
                {[
                  { label: '热量', value: `${calculateNutrition(selectedFood.calories, grams)}千卡` },
                  { label: '蛋白质', value: `${calculateNutrition(selectedFood.protein, grams)}g` },
                  { label: '碳水', value: `${calculateNutrition(selectedFood.carbs, grams)}g` },
                  { label: '脂肪', value: `${calculateNutrition(selectedFood.fat, grams)}g` },
                ].map(({ label, value }) => (
                  <div key={label} style={styles.previewItem}>
                    <span>{label}</span>
                    <span style={styles.previewValue}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <ModalActions onCancel={closeAddModal} onConfirm={handleAddFood} confirmText="添加" />
          </>
        ) : (
          <>
            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <FormField label="食物名称" required>
                <input type="text" value={manualFood.name} onChange={(e) => setManualFood({ ...manualFood, name: e.target.value })} style={inputStyle} placeholder="例：鸡胸肉" />
              </FormField>
              <FormField label="重量（克）">
                <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                  <input type="number" value={manualFood.grams} onChange={(e) => setManualFood({ ...manualFood, grams: e.target.value })} style={{ ...inputStyle, marginTop: 0, flex: 1 }} placeholder="例：150" min="0" max="5000" />
                  <QuickValueButtons values={[50, 100, 150, 200]} onSelect={(v) => setManualFood({ ...manualFood, grams: v.toString() })} unit="g" />
                </div>
              </FormField>
              <FormField label="热量（千卡）" required>
                <input type="number" value={manualFood.calories} onChange={(e) => setManualFood({ ...manualFood, calories: e.target.value })} style={inputStyle} placeholder="例：165" min="0" max="10000" />
              </FormField>
              <FormField label="蛋白质（克）">
                <input type="number" value={manualFood.protein} onChange={(e) => setManualFood({ ...manualFood, protein: e.target.value })} style={inputStyle} placeholder="例：31" min="0" />
              </FormField>
              <FormField label="碳水（克）">
                <input type="number" value={manualFood.carbs} onChange={(e) => setManualFood({ ...manualFood, carbs: e.target.value })} style={inputStyle} placeholder="例：0" min="0" />
              </FormField>
              <FormField label="脂肪（克）">
                <input type="number" value={manualFood.fat} onChange={(e) => setManualFood({ ...manualFood, fat: e.target.value })} style={inputStyle} placeholder="例：3.6" min="0" />
              </FormField>
            </div>
            <ModalActions onCancel={closeAddModal} onConfirm={handleManualAdd} confirmText={editingFoodId ? '保存' : '添加'} />
          </>
        )}
      </Modal>

      {/* AI recognition modal */}
      <Modal isOpen={showAIModal} onClose={closeAIModal} title="AI 智能识别">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-base)' }}>
          <span style={{
            padding: '3px var(--space-sm)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', fontWeight: '600',
            background: hasAI ? 'var(--success-bg-badge)' : 'var(--warning-bg)',
            color: hasAI ? 'var(--success)' : 'var(--warning)',
          }}>
            {hasAI ? `AI: ${(aiConfig?.model || '').split('/').pop()}` : '本地匹配模式'}
          </span>
          {!hasAI && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>在设置中配置 API 可识别任意食物</span>}
        </div>

        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <FormField label="描述你吃了什么">
            <textarea
              value={aiInput}
              onChange={(e) => { setAiInput(e.target.value); setAiError(''); setAiResults([]); }}
              style={textareaStyle}
              placeholder={hasAI ? '随意描述，如：早上吃了煎饼果子加一杯豆浆' : '例：一碗米饭，200g鸡胸肉，一份西兰花'}
              rows={3}
              autoFocus
            />
          </FormField>
          {!hasAI && (
            <div style={styles.aiHint}>
              支持量词：一碗/两碗/半碗、一份、一个、一杯、一盘等<br />
              支持克数：200g鸡胸肉、150克米饭<br />
              多个食物用逗号、空格或顿号分隔
            </div>
          )}
          {aiLoading && <div style={{ textAlign: 'center', padding: 'var(--space-lg)', color: 'var(--accent)', fontSize: 'var(--text-base)' }}>AI 正在分析中...</div>}
          {aiError && <div style={{ color: 'var(--danger)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-sm)', padding: 'var(--space-sm) var(--space-md)', background: 'var(--danger-bg)', borderRadius: 'var(--radius-sm)' }}>{aiError}</div>}
          {aiResults.length > 0 && (
            <div style={{ marginTop: 'var(--space-md)' }}>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>识别到 {aiResults.length} 项食物：</div>
              {aiResults.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-sm) var(--space-md)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-base)', marginBottom: '6px' }}>
                  <div>
                    <span style={{ color: 'var(--text-heading)', fontSize: 'var(--text-base)', fontWeight: '500' }}>{item.name}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginLeft: 'var(--space-sm)' }}>{item.grams}g</span>
                  </div>
                  <span style={{ color: 'var(--accent)', fontSize: 'var(--text-base)', fontWeight: '600' }}>{Math.round(item.calories)} kcal</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: 'var(--text-base)', fontWeight: '600', color: 'var(--success)', marginTop: 'var(--space-xs)', padding: '0 var(--space-md)' }}>
                合计：{aiResults.reduce((s, item) => s + (item.calories || 0), 0).toFixed(0)} kcal
              </div>
            </div>
          )}
        </div>
        <ModalActions
          onCancel={closeAIModal}
          onConfirm={aiResults.length === 0 ? handleAIRecognition : handleConfirmAIResults}
          confirmText={aiResults.length === 0 ? (aiLoading ? '分析中...' : '识别') : '确认添加'}
          confirmDisabled={aiLoading}
          confirmStyle={aiResults.length > 0 ? { background: 'var(--success)' } : {}}
        />
      </Modal>
    </div>
  );
};

// --- Styles (modal-related styles removed, handled by ui/Modal) ---

const styles = {
  container: { padding: 'var(--space-lg)', maxWidth: '800px', margin: '0 auto' },
  quickSection: { marginBottom: 'var(--space-lg)' },
  quickHeader: { fontSize: 'var(--text-base)', fontWeight: '600', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' },
  quickList: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' },
  quickChip: { display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', borderRadius: 'var(--radius-full)', padding: 'var(--space-sm) var(--space-md)', cursor: 'pointer', fontSize: 'var(--text-sm)' },
  quickMeta: { color: 'var(--text-nav)', fontSize: 'var(--text-xs)' },
  searchSection: { marginBottom: 'var(--space-lg)' },
  searchBox: { position: 'relative', marginBottom: 'var(--space-md)' },
  searchIcon: { position: 'absolute', left: 'var(--space-md)', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' },
  searchInput: { width: '100%', padding: 'var(--space-md) 40px var(--space-md) 44px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-base)', color: 'var(--text-heading)', fontSize: 'var(--text-base)', outline: 'none', transition: 'border-color var(--duration-slow)' },
  clearButton: { position: 'absolute', right: 'var(--space-md)', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 'var(--space-xs)', display: 'flex' },
  actionButtons: { display: 'flex', gap: 'var(--space-md)' },
  aiButton: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 16px', background: 'var(--btn-primary-bg)', border: 'none', borderRadius: '7.5px', color: 'var(--btn-primary-text)', fontSize: 'var(--text-base)', fontWeight: '400', cursor: 'pointer', transition: 'all 200ms ease' },
  manualButton: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 16px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '7.5px', color: 'var(--text-primary)', fontSize: 'var(--text-base)', fontWeight: '400', cursor: 'pointer', transition: 'background 200ms ease' },
  searchResults: { marginBottom: 'var(--space-lg)' },
  foodCard: { display: 'flex', width: '100%', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-base)', marginBottom: 'var(--space-sm)', cursor: 'pointer', overflow: 'hidden', transition: 'transform var(--duration-base)', border: '1px solid var(--border)', padding: 0, textAlign: 'left' },
  categoryBar: { width: '4px', flexShrink: 0 },
  foodContent: { flex: 1, padding: 'var(--space-md)' },
  foodHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' },
  foodName: { margin: 0, fontSize: 'var(--text-md)', fontWeight: '500', color: 'var(--text-heading)' },
  categoryBadge: { padding: '2px var(--space-sm)', background: 'var(--border)', borderRadius: '4px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' },
  foodNutrition: { display: 'flex', alignItems: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' },
  divider: { margin: '0 var(--space-sm)', color: 'var(--border-divider)' },
  todaySection: { marginBottom: 'var(--space-lg)' },
  sectionTitle: { fontSize: 'var(--text-lg)', fontWeight: '600', color: 'var(--text-heading)', marginBottom: 'var(--space-md)' },
  logsList: { display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' },
  logItem: { display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-base)', padding: 'var(--space-md)', transition: 'background var(--duration-base)' },
  logContent: { flex: 1 },
  logHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' },
  logName: { fontSize: 'var(--text-md)', fontWeight: '500', color: 'var(--text-heading)' },
  logTime: { fontSize: 'var(--text-xs)', color: 'var(--text-muted)' },
  logNutrition: { display: 'flex', alignItems: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' },
  logCalories: { color: 'var(--accent)', fontWeight: '500' },
  logActions: { display: 'flex', alignItems: 'center' },
  editButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '44px', minHeight: '44px', width: '44px', height: '44px', background: 'transparent', border: 'none', borderRadius: 'var(--radius-sm)', color: 'var(--accent)', cursor: 'pointer', transition: 'all var(--duration-base)', marginLeft: 'var(--space-sm)' },
  deleteButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '44px', minHeight: '44px', width: '44px', height: '44px', background: 'transparent', border: 'none', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', cursor: 'pointer', transition: 'all var(--duration-base)', marginLeft: 'var(--space-sm)' },
  summary: { background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-base)' },
  summaryTitle: { fontSize: 'var(--text-lg)', fontWeight: '600', color: 'var(--text-heading)', marginBottom: 'var(--space-md)' },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-md)' },
  summaryItem: { display: 'flex', flexDirection: 'column', padding: 'var(--space-md)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-base)' },
  summaryLabel: { fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' },
  summaryValue: { fontSize: 'var(--text-xl)', fontWeight: '600', color: 'var(--text-heading)' },
  nutritionPreview: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-md)', marginTop: 'var(--space-base)', padding: 'var(--space-base)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-base)' },
  previewItem: { display: 'flex', flexDirection: 'column', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' },
  previewValue: { marginTop: 'var(--space-xs)', fontSize: 'var(--text-lg)', fontWeight: '600', color: 'var(--text-heading)' },
  aiHint: { fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-sm)', fontStyle: 'italic' },
};

export default FoodLogger;
