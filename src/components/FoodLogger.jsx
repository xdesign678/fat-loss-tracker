import React, { useState, useMemo } from 'react';
import { Search, Plus, Sparkles, X, Edit3 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { searchFood, foodDatabase } from '../utils/foodDatabase';
import { formatDate } from '../utils/calculations';

const FoodLogger = () => {
  const { state, dispatch } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [grams, setGrams] = useState(100);
  const [aiInput, setAiInput] = useState('');
  const [manualFood, setManualFood] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: ''
  });

  const today = formatDate(new Date());
  const todayLogs = state.dailyLogs[today]?.foods || [];

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchFood(searchQuery);
  }, [searchQuery]);

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

    dispatch({ type: 'LOG_FOOD', payload: { date: today, food } });
    setShowAddModal(false);
    setSelectedFood(null);
    setSearchQuery('');
  };

  const handleManualAdd = () => {
    if (!manualFood.name || !manualFood.calories) return;

    const food = {
      name: manualFood.name,
      grams: 0,
      calories: parseFloat(manualFood.calories),
      protein: parseFloat(manualFood.protein) || 0,
      carbs: parseFloat(manualFood.carbs) || 0,
      fat: parseFloat(manualFood.fat) || 0,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    };

    dispatch({ type: 'LOG_FOOD', payload: { date: today, food } });
    setManualFood({ name: '', calories: '', protein: '', carbs: '', fat: '' });
    setShowAddModal(false);
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

  const callOpenRouter = async (text) => {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiSettings.apiKey}`,
      },
      body: JSON.stringify({
        model: aiSettings.selectedModel,
        messages: [{
          role: 'system',
          content: `你是一个食物营养分析助手。用户会告诉你他吃了什么，你需要分析每种食物并返回JSON数组。
每个元素格式：{"name":"食物名","grams":克数,"calories":总热量kcal,"protein":蛋白质g,"carbs":碳水g,"fat":脂肪g}
注意：calories/protein/carbs/fat是该份量的总量，不是每100g的值。
只返回JSON数组，不要有其他文字。`
        }, {
          role: 'user',
          content: text,
        }],
        max_tokens: 1000,
        temperature: 0.1,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `API错误 ${res.status}`);
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    // 提取JSON数组
    const match = content.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('AI返回格式异常');
    return JSON.parse(match[0]);
  };

  const handleAIRecognition = async () => {
    if (!aiInput.trim()) return;

    if (hasAI) {
      // 使用 OpenRouter API
      setAiLoading(true);
      setAiError('');
      setAiResults([]);
      try {
        const items = await callOpenRouter(aiInput);
        if (!Array.isArray(items) || items.length === 0) {
          setAiError('AI 未能识别食物，请重新描述');
        } else {
          setAiResults(items.map(item => ({
            name: item.name,
            grams: item.grams || 100,
            calories: Math.round(item.calories || 0),
            protein: Math.round(item.protein || 0),
            carbs: Math.round(item.carbs || 0),
            fat: Math.round(item.fat || 0),
            fromAI: true,
          })));
        }
      } catch (e) {
        setAiError(`AI 识别失败: ${e.message}`);
      }
      setAiLoading(false);
    } else {
      // 本地匹配 fallback
      const recognized = parseAIInput(aiInput);
      if (recognized.length === 0) {
        setAiError('未识别到食物。配置 AI 设置可识别任意食物，或使用"一碗米饭"等格式匹配本地数据库');
        setAiResults([]);
        return;
      }
      setAiError('');
      setAiResults(recognized.map(item => ({
        name: stripParens(item.name),
        grams: item.grams,
        calories: parseFloat(calculateNutrition(item.calories, item.grams)),
        protein: parseFloat(calculateNutrition(item.protein, item.grams)),
        carbs: parseFloat(calculateNutrition(item.carbs, item.grams)),
        fat: parseFloat(calculateNutrition(item.fat, item.grams)),
        fromAI: false,
      })));
    }
  };

  const handleConfirmAIResults = () => {
    aiResults.forEach(item => {
      const food = {
        name: item.name,
        grams: item.grams,
        calories: item.fromAI ? item.calories : item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      };
      dispatch({ type: 'LOG_FOOD', payload: { date: today, food } });
    });
    setShowAIModal(false);
    setAiInput('');
    setAiResults([]);
    setAiError('');
  };

  const handleDeleteFood = (index) => {
    dispatch({ type: 'REMOVE_FOOD', payload: { date: today, index } });
  };

  return (
    <div style={styles.container}>
      {/* 搜索区域 */}
      <div style={styles.searchSection}>
        <div style={styles.searchBox}>
          <Search size={20} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="搜索食物..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.actionButtons}>
          <button
            onClick={() => setShowAIModal(true)}
            style={styles.aiButton}
          >
            <Sparkles size={18} />
            <span style={{ marginLeft: '6px' }}>AI识别</span>
          </button>
          <button
            onClick={() => {
              setSelectedFood(null);
              setShowAddModal(true);
            }}
            style={styles.manualButton}
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
            <div
              key={index}
              onClick={() => handleFoodSelect(food)}
              style={styles.foodCard}
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
            </div>
          ))}
        </div>
      )}

      {/* 今日记录 */}
      <div style={styles.todaySection}>
        <h3 style={styles.sectionTitle}>今日已记录</h3>
        {todayLogs.length === 0 ? (
          <div style={styles.emptyState}>暂无记录</div>
        ) : (
          <div style={styles.logsList}>
            {todayLogs.map((food, index) => (
              <div key={index} style={styles.logItem}>
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
                <button
                  onClick={() => handleDeleteFood(index)}
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
        <div style={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            {selectedFood ? (
              <>
                <h3 style={styles.modalTitle}>{selectedFood.name}</h3>
                <div style={styles.modalContent}>
                  <label style={styles.label}>
                    <span>重量（克）</span>
                    <input
                      type="number"
                      value={grams}
                      onChange={(e) => setGrams(e.target.value)}
                      style={styles.input}
                      autoFocus
                    />
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
                  <button onClick={() => setShowAddModal(false)} style={styles.cancelButton}>
                    取消
                  </button>
                  <button onClick={handleAddFood} style={styles.confirmButton}>
                    添加
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 style={styles.modalTitle}>手动输入食物</h3>
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

      {/* AI识别弹窗 */}
      {showAIModal && (
        <div style={styles.modalOverlay} onClick={() => { setShowAIModal(false); setAiResults([]); setAiError(''); }}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>AI 智能识别</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{
                padding: '3px 10px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '600',
                background: hasAI ? 'rgba(46,204,113,0.15)' : 'rgba(245,158,11,0.15)',
                color: hasAI ? '#2ecc71' : '#f59e0b',
              }}>
                {hasAI ? `AI: ${aiSettings.selectedModel.split('/').pop()}` : '本地匹配模式'}
              </span>
              {!hasAI && (
                <span style={{ fontSize: '11px', color: '#6b7280' }}>
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
                <div style={{ textAlign: 'center', padding: '20px', color: '#4f8ef7', fontSize: '14px' }}>
                  AI 正在分析中...
                </div>
              )}
              {aiError && (
                <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '8px', padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: '6px' }}>
                  {aiError}
                </div>
              )}
              {aiResults.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '8px' }}>
                    识别到 {aiResults.length} 项食物：
                  </div>
                  {aiResults.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#151820', borderRadius: '8px', marginBottom: '6px' }}>
                      <div>
                        <span style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>{item.name}</span>
                        <span style={{ color: '#6b7280', fontSize: '12px', marginLeft: '8px' }}>{item.grams}g</span>
                      </div>
                      <span style={{ color: '#4f8ef7', fontSize: '14px', fontWeight: '600' }}>
                        {Math.round(item.calories)} kcal
                      </span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '14px', fontWeight: '600', color: '#2ecc71', marginTop: '4px', padding: '0 12px' }}>
                    合计：{aiResults.reduce((s, item) => s + (item.calories || 0), 0).toFixed(0)} kcal
                  </div>
                </div>
              )}
            </div>
            <div style={styles.modalActions}>
              <button onClick={() => { setShowAIModal(false); setAiResults([]); setAiError(''); }} style={styles.cancelButton}>
                取消
              </button>
              {aiResults.length === 0 ? (
                <button onClick={handleAIRecognition} style={styles.confirmButton} disabled={aiLoading}>
                  {aiLoading ? '分析中...' : '识别'}
                </button>
              ) : (
                <button onClick={handleConfirmAIResults} style={{ ...styles.confirmButton, background: '#2ecc71' }}>
                  确认添加
                </button>
              )}
            </div>
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
    color: '#7f8c8d'
  },
  searchInput: {
    width: '100%',
    padding: '12px 12px 12px 44px',
    background: '#1a1e28',
    border: '1px solid #252a38',
    borderRadius: '8px',
    color: '#fff',
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
    background: 'linear-gradient(135deg, #7c5cf7, #a78bfa)',
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
    background: '#1a1e28',
    border: '1px solid #252a38',
    borderRadius: '8px',
    color: '#fff',
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
    background: '#151820',
    borderRadius: '8px',
    marginBottom: '8px',
    cursor: 'pointer',
    overflow: 'hidden',
    transition: 'transform 0.2s'
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
    color: '#fff'
  },
  categoryBadge: {
    padding: '2px 8px',
    background: '#252a38',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#9ca3af'
  },
  foodNutrition: {
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
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
    marginBottom: '12px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#6b7280',
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
  logNutrition: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '13px',
    color: '#9ca3af'
  },
  logCalories: {
    color: '#4f8ef7',
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
    padding: '16px'
  },
  summaryTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
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
    background: '#1a1e28',
    borderRadius: '8px'
  },
  summaryLabel: {
    fontSize: '13px',
    color: '#9ca3af',
    marginBottom: '4px'
  },
  summaryValue: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#4f8ef7'
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
  textarea: {
    marginTop: '6px',
    padding: '10px',
    background: '#151820',
    border: '1px solid #252a38',
    borderRadius: '6px',
    color: '#fff',
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
    background: '#151820',
    borderRadius: '8px'
  },
  previewItem: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: '13px',
    color: '#9ca3af'
  },
  previewValue: {
    marginTop: '4px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff'
  },
  aiHint: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '8px',
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

export default FoodLogger;
