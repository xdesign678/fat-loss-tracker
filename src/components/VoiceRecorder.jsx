import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, X, Check, RotateCcw, Loader, Utensils, Dumbbell } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDate } from '../utils/calculations';
import { requestAIJson, getAIConfig, transcribeAudio } from '../utils/ai';
import { useToast } from './Toast';

// Pure helper functions (no hooks needed)
function normalizeFoodItem(item = {}) {
  return {
    name: item.name || '',
    grams: Math.round(item.grams || 0),
    calories: Math.round(item.calories || 0),
    protein: Math.round(item.protein || 0),
    carbs: Math.round(item.carbs || 0),
    fat: Math.round(item.fat || 0),
  };
}

function normalizeExerciseItem(item = {}) {
  return {
    name: item.name || '',
    duration: Math.round(item.duration || 30),
    calories: Math.round(item.calories || 0),
    category: item.category || '其他',
  };
}

function normalizeResults(parsed, isLocal = false) {
  if (parsed?.type === 'mixed') {
    return {
      type: 'mixed',
      foods: Array.isArray(parsed.foods) ? parsed.foods.map(normalizeFoodItem) : [],
      exercises: Array.isArray(parsed.exercises) ? parsed.exercises.map(normalizeExerciseItem) : [],
      isLocal,
    };
  }

  if (parsed?.type === 'exercise') {
    return {
      type: 'exercise',
      items: Array.isArray(parsed.items) ? parsed.items.map(normalizeExerciseItem) : [],
      isLocal,
    };
  }

  return {
    type: 'food',
    items: Array.isArray(parsed?.items) ? parsed.items.map(normalizeFoodItem) : [],
    isLocal,
  };
}

// States: idle, recording, processing, results, error
const VoiceRecorder = ({ isOpen, onClose }) => {
  const { state, dispatch } = useApp();
  const showToast = useToast();
  const [status, setStatus] = useState('idle');
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [pulseAnim, setPulseAnim] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const today = formatDate(new Date());

  const stopMediaStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const stopSpeechRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) { /* ignore */ }
      recognitionRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    stopSpeechRecognition();
  }, [stopSpeechRecognition]);

  useEffect(() => {
    return () => {
      stopRecording();
      stopMediaStream();
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [stopRecording, stopMediaStream]);

  const getAPIConfig = useCallback(() => {
    return getAIConfig(state.aiSettings);
  }, [state.aiSettings]);

  const localFallbackAnalysis = useCallback((text) => {
    const exerciseKeywords = ['跑步', '走路', '游泳', '骑车', '骑行', '健身', '深蹲', '俯卧撑',
      '瑜伽', '跳绳', '打球', '篮球', '足球', '羽毛球', '乒乓球', '网球',
      '拉伸', '举重', '卧推', '引体向上', '平板支撑', '开合跳', '爬楼梯',
      '散步', '慢跑', '快走', '登山', '太极', '跳舞', '运动'];
    const foodKeywords = ['吃', '喝', '早餐', '午餐', '晚餐', '零食', '饭', '面', '菜',
      '肉', '鸡', '鱼', '虾', '蛋', '奶', '茶', '咖啡', '果汁', '水果',
      '米饭', '面条', '包子', '饺子', '馒头', '粥', '汤', '沙拉', '牛排'];

    const isExercise = exerciseKeywords.some(k => text.includes(k));
    const isFood = foodKeywords.some(k => text.includes(k));

    const fallbackResult = isExercise && !isFood
      ? {
          type: 'exercise',
          items: [{ name: text, duration: 30, calories: 150, category: '其他' }],
        }
      : {
          type: 'food',
          items: [{ name: text, grams: 100, calories: 200, protein: 10, carbs: 20, fat: 5 }],
        };

    setResults(normalizeResults(fallbackResult, true));
    setStatus('results');
  }, []);

  const analyzeWithAI = useCallback(async (text) => {
    setStatus('processing');
    setError('');

    const apiConfig = getAPIConfig();
    if (!apiConfig) {
      localFallbackAnalysis(text);
      return;
    }

    try {
      const parsed = await requestAIJson({
        apiKey: apiConfig.key,
        model: apiConfig.model,
        url: apiConfig.url,
        responseType: 'object',
        systemPrompt: `你是一个健康记录助手。用户会用语音告诉你他吃了什么或做了什么运动。
请分析用户的输入，判断是【饮食】还是【运动】，然后返回JSON。

如果是饮食，返回格式：
{"type":"food","items":[{"name":"食物名","grams":克数,"calories":总热量kcal,"protein":蛋白质g,"carbs":碳水g,"fat":脂肪g}]}

如果是运动，返回格式：
{"type":"exercise","items":[{"name":"运动名","duration":分钟数,"calories":消耗热量kcal,"category":"运动类别"}]}

运动类别可选：有氧、力量、柔韧、球类、日常、其他

注意：
- calories/protein/carbs/fat 是该份量的总量，不是每100g
- 如果用户同时提到了饮食和运动，返回 type:"mixed"，同时包含 foods 和 exercises 两个数组
- mixed格式：{"type":"mixed","foods":[...],"exercises":[...]}
- 只返回JSON，不要有其他文字`,
        userPrompt: text,
      });

      setResults(normalizeResults(parsed));
      setStatus('results');
    } catch (e) {
      setError(`AI 分析失败: ${e.message}`);
      setStatus('error');
    }
  }, [getAPIConfig, localFallbackAnalysis]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setTranscript('');
      setInterimText('');
      setResults(null);
      setError('');
      setRecordingDuration(0);
      audioChunksRef.current = [];
    } else {
      stopRecording(); // also stops SpeechRecognition
      stopMediaStream();
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  }, [isOpen, stopRecording, stopMediaStream]);

  // Pulse animation and timer for recording
  useEffect(() => {
    if (status === 'recording') {
      const pulseInterval = setInterval(() => setPulseAnim(prev => !prev), 800);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      return () => {
        clearInterval(pulseInterval);
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
      };
    }
    setPulseAnim(false);
  }, [status]);

  const startSpeechPreview = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return; // graceful: no real-time preview on unsupported browsers

    const recognition = new SR();
    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let finalText = '';
      let interim = '';
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      if (finalText) setTranscript(finalText);
      setInterimText(interim);
    };

    // SpeechRecognition errors are non-fatal (recording continues via MediaRecorder)
    recognition.onerror = () => {};
    recognition.onend = () => { recognitionRef.current = null; };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch (_) { /* ignore */ }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      if (navigator.vibrate) navigator.vibrate(50);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';

      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onerror = () => {
        setError('录音出错，请重试');
        setStatus('error');
        stopMediaStream();
      };

      mediaRecorderRef.current = recorder;
      recorder.start(500);
      setStatus('recording');
      setTranscript('');
      setInterimText('');
      setError('');

      // Start Web Speech API in parallel for real-time text preview
      startSpeechPreview();
    } catch (e) {
      if (e.name === 'NotAllowedError') {
        setError('麦克风权限被拒绝，请在浏览器设置中允许');
      } else {
        setError(`无法启动录音: ${e.message}`);
      }
      setStatus('error');
    }
  }, [stopMediaStream, startSpeechPreview]);

  const handleStopAndProcess = useCallback(async () => {
    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
    // Stop SpeechRecognition preview
    stopSpeechRecognition();

    // Stop MediaRecorder and collect audio
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      setError('录音未启动');
      setStatus('error');
      return;
    }

    const audioBlob = await new Promise((resolve) => {
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        resolve(new Blob(audioChunksRef.current, { type: mimeType }));
      };
      recorder.stop();
    });
    stopMediaStream();
    mediaRecorderRef.current = null;

    if (audioBlob.size < 1000) {
      setError('录音时间太短，请再试一次');
      setStatus('error');
      return;
    }

    // Step 1: AI transcription (Gemini) for accurate result
    setStatus('processing');
    setInterimText('AI 精准转写中...');
    try {
      const text = await transcribeAudio({ audioBlob, aiSettings: state.aiSettings });
      setTranscript(text);
      setInterimText('');
      // Step 2: Analyze the transcript
      await analyzeWithAI(text);
    } catch (e) {
      // If Gemini transcription fails, fall back to Web Speech API result
      const fallbackText = transcript || interimText;
      if (fallbackText?.trim()) {
        setTranscript(fallbackText);
        setInterimText('');
        await analyzeWithAI(fallbackText);
      } else {
        setError(`语音识别失败: ${e.message}`);
        setStatus('error');
      }
    }
  }, [analyzeWithAI, stopMediaStream, stopSpeechRecognition, state.aiSettings, transcript, interimText]);

  const getFoodResults = () => {
    if (!results) return [];
    if (results.type === 'mixed') return results.foods || [];
    if (results.type === 'food') return results.items || [];
    return [];
  };

  const getExerciseResults = () => {
    if (!results) return [];
    if (results.type === 'mixed') return results.exercises || [];
    if (results.type === 'exercise') return results.items || [];
    return [];
  };

  const updateResultItem = (group, index, field, value) => {
    setResults((prev) => {
      if (!prev) return prev;

      const listKey = prev.type === 'mixed' ? group : 'items';
      const nextItems = (prev[listKey] || []).map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        return {
          ...item,
          [field]: field === 'name' || field === 'category'
            ? value
            : value === ''
              ? ''
              : Number(value),
        };
      });

      return {
        ...prev,
        [listKey]: nextItems,
      };
    });
  };

  const removeResultItem = (group, index) => {
    setResults((prev) => {
      if (!prev) return prev;

      const listKey = prev.type === 'mixed' ? group : 'items';
      return {
        ...prev,
        [listKey]: (prev[listKey] || []).filter((_, itemIndex) => itemIndex !== index),
      };
    });
  };

  const handleConfirm = () => {
    if (!results) return;
    const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const foods = getFoodResults();
    const exercises = getExerciseResults();

    foods.forEach(item => {
        dispatch({
          type: 'LOG_FOOD',
          payload: {
            date: today,
            food: {
              name: item.name,
              grams: Number(item.grams) || 0,
              calories: Math.round(item.calories || 0),
              protein: Math.round(item.protein || 0),
              carbs: Math.round(item.carbs || 0),
              fat: Math.round(item.fat || 0),
              time,
            },
          },
        });
      });

    exercises.forEach(item => {
        dispatch({
          type: 'LOG_EXERCISE',
          payload: {
            date: today,
            exercise: {
              name: item.name,
              duration: Number(item.duration) || 30,
              calories: Math.round(item.calories || 0),
              category: item.category || '其他',
              time,
            },
          },
        });
      });

    showToast(`已添加 ${foods.length} 条饮食、${exercises.length} 条运动记录`, 'success');

    onClose();
  };

  const handleRetry = () => {
    setStatus('idle');
    setTranscript('');
    setInterimText('');
    setResults(null);
    setError('');
  };

  if (!isOpen) return null;

  const displayText = transcript || interimText;
  const foodResults = getFoodResults();
  const exerciseResults = getExerciseResults();
  const hasAnyResults = foodResults.length + exerciseResults.length > 0;
  const recordingTimeLabel = `${String(Math.floor(recordingDuration / 60)).padStart(2, '0')}:${String(recordingDuration % 60).padStart(2, '0')}`;

  const renderTypeTag = (type) => {
    if (type === 'food') {
      return (
        <span style={styles.typeTagFood}>
          <Utensils size={14} /> 饮食记录
        </span>
      );
    }
    if (type === 'exercise') {
      return (
        <span style={styles.typeTagExercise}>
          <Dumbbell size={14} /> 运动记录
        </span>
      );
    }
    return (
      <span style={styles.typeTagMixed}>
        <Utensils size={14} /> + <Dumbbell size={14} /> 混合记录
      </span>
    );
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h3 style={styles.title}>语音记录</h3>
          <button onClick={onClose} style={styles.closeBtn}>
            <X size={22} />
          </button>
        </div>

        {/* Main content area */}
        <div style={styles.body}>
          {/* Idle state */}
          {status === 'idle' && (
            <div style={styles.idleArea}>
              <div style={styles.hintText}>
                点击麦克风开始说话
              </div>
              <div style={styles.hintSubtext}>
                告诉我你吃了什么或做了什么运动
              </div>
              <div style={styles.examples}>
                <span style={styles.exampleItem}>"午餐吃了一碗米饭和红烧肉"</span>
                <span style={styles.exampleItem}>"跑步30分钟"</span>
                <span style={styles.exampleItem}>"喝了一杯拿铁然后骑车20分钟"</span>
              </div>
            </div>
          )}

          {/* Recording state */}
          {status === 'recording' && (
            <div style={styles.recordingArea}>
              <div style={styles.waveContainer}>
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      ...styles.waveBar,
                      height: pulseAnim ? `${20 + Math.random() * 30}px` : '8px',
                      transitionDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
              <div style={styles.recordingText}>正在聆听...</div>
              <div style={styles.recordingDuration}>{recordingTimeLabel}</div>
              {displayText && (
                <div style={styles.transcriptPreview}>
                  {displayText}
                </div>
              )}
            </div>
          )}

          {/* Processing state */}
          {status === 'processing' && (
            <div style={styles.processingArea}>
              <div style={styles.spinner}>
                <Loader size={32} style={styles.spinnerIcon} />
              </div>
              <div style={styles.processingText}>{interimText || 'AI 正在分析...'}</div>
              {transcript && <div style={styles.transcriptPreview}>{transcript}</div>}
            </div>
          )}

          {/* Results state */}
          {status === 'results' && results && (
            <div style={styles.resultsArea}>
              <div style={styles.resultHeader}>
                {renderTypeTag(results.type)}
                {results.isLocal && (
                  <span style={styles.localTag}>本地估算</span>
                )}
              </div>

              <div style={styles.transcriptBox}>
                <span style={styles.transcriptLabel}>识别内容</span>
                <span style={styles.transcriptContent}>{transcript}</span>
              </div>

              {/* Food items */}
              {(results.type === 'food' || results.type === 'mixed') && (
                <div style={styles.resultSection}>
                  <div style={styles.resultSectionTitle}>
                    <Utensils size={16} color="var(--warning)" /> 饮食
                  </div>
                  {foodResults.map((item, i) => (
                    <div key={`food-${i}`} style={styles.resultItem}>
                      <div style={styles.resultItemHeader}>
                        <span style={styles.resultItemName}>{item.name || `食物 ${i + 1}`}</span>
                        <div style={styles.resultItemActions}>
                          <span style={styles.resultItemCal}>{Math.round(item.calories)} kcal</span>
                          <button
                            type="button"
                            onClick={() => removeResultItem(results.type === 'mixed' ? 'foods' : 'items', i)}
                            style={styles.removeItemButton}
                            className="btn-interactive"
                            aria-label={`删除饮食识别结果 ${item.name || i + 1}`}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                      <div style={styles.editorGrid}>
                        <label style={styles.editorField}>
                          <span>名称</span>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateResultItem(results.type === 'mixed' ? 'foods' : 'items', i, 'name', e.target.value)}
                            style={styles.editorInput}
                          />
                        </label>
                        <label style={styles.editorField}>
                          <span>克数</span>
                          <input
                            type="number"
                            value={item.grams}
                            onChange={(e) => updateResultItem(results.type === 'mixed' ? 'foods' : 'items', i, 'grams', e.target.value)}
                            style={styles.editorInput}
                          />
                        </label>
                        <label style={styles.editorField}>
                          <span>热量</span>
                          <input
                            type="number"
                            value={item.calories}
                            onChange={(e) => updateResultItem(results.type === 'mixed' ? 'foods' : 'items', i, 'calories', e.target.value)}
                            style={styles.editorInput}
                          />
                        </label>
                        <label style={styles.editorField}>
                          <span>蛋白</span>
                          <input
                            type="number"
                            value={item.protein}
                            onChange={(e) => updateResultItem(results.type === 'mixed' ? 'foods' : 'items', i, 'protein', e.target.value)}
                            style={styles.editorInput}
                          />
                        </label>
                        <label style={styles.editorField}>
                          <span>碳水</span>
                          <input
                            type="number"
                            value={item.carbs}
                            onChange={(e) => updateResultItem(results.type === 'mixed' ? 'foods' : 'items', i, 'carbs', e.target.value)}
                            style={styles.editorInput}
                          />
                        </label>
                        <label style={styles.editorField}>
                          <span>脂肪</span>
                          <input
                            type="number"
                            value={item.fat}
                            onChange={(e) => updateResultItem(results.type === 'mixed' ? 'foods' : 'items', i, 'fat', e.target.value)}
                            style={styles.editorInput}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Exercise items */}
              {(results.type === 'exercise' || results.type === 'mixed') && (
                <div style={styles.resultSection}>
                  <div style={styles.resultSectionTitle}>
                    <Dumbbell size={16} color="var(--success)" /> 运动
                  </div>
                  {exerciseResults.map((item, i) => (
                    <div key={`exercise-${i}`} style={styles.resultItem}>
                      <div style={styles.resultItemHeader}>
                        <span style={styles.resultItemName}>{item.name || `运动 ${i + 1}`}</span>
                        <div style={styles.resultItemActions}>
                          <span style={styles.resultItemCalGreen}>-{Math.round(item.calories)} kcal</span>
                          <button
                            type="button"
                            onClick={() => removeResultItem(results.type === 'mixed' ? 'exercises' : 'items', i)}
                            style={styles.removeItemButton}
                            className="btn-interactive"
                            aria-label={`删除运动识别结果 ${item.name || i + 1}`}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                      <div style={styles.editorGrid}>
                        <label style={styles.editorField}>
                          <span>名称</span>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateResultItem(results.type === 'mixed' ? 'exercises' : 'items', i, 'name', e.target.value)}
                            style={styles.editorInput}
                          />
                        </label>
                        <label style={styles.editorField}>
                          <span>时长</span>
                          <input
                            type="number"
                            value={item.duration}
                            onChange={(e) => updateResultItem(results.type === 'mixed' ? 'exercises' : 'items', i, 'duration', e.target.value)}
                            style={styles.editorInput}
                          />
                        </label>
                        <label style={styles.editorField}>
                          <span>热量</span>
                          <input
                            type="number"
                            value={item.calories}
                            onChange={(e) => updateResultItem(results.type === 'mixed' ? 'exercises' : 'items', i, 'calories', e.target.value)}
                            style={styles.editorInput}
                          />
                        </label>
                        <label style={styles.editorField}>
                          <span>分类</span>
                          <input
                            type="text"
                            value={item.category}
                            onChange={(e) => updateResultItem(results.type === 'mixed' ? 'exercises' : 'items', i, 'category', e.target.value)}
                            style={styles.editorInput}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Error state */}
          {status === 'error' && (
            <div style={styles.errorArea}>
              <MicOff size={40} color="var(--danger)" />
              <div style={styles.errorText}>{error}</div>
            </div>
          )}
        </div>

        {/* Bottom actions */}
        <div style={styles.actions}>
          {status === 'idle' && (
            <button onClick={startRecording} style={styles.micButton}>
              <Mic size={28} color="#fff" />
            </button>
          )}

          {status === 'recording' && (
            <button onClick={handleStopAndProcess} style={styles.stopButton}>
              <div style={styles.stopIcon} />
              <span style={styles.stopLabel}>完成</span>
            </button>
          )}

          {status === 'results' && (
            <div style={styles.resultActions}>
              <button onClick={handleRetry} style={styles.retryButton}>
                <RotateCcw size={18} />
                <span>重试</span>
              </button>
              <button onClick={handleConfirm} style={styles.confirmButton} disabled={!hasAnyResults}>
                <Check size={18} />
                <span>确认记录</span>
              </button>
            </div>
          )}

          {status === 'error' && (
            <button onClick={handleRetry} style={styles.retryButtonFull}>
              <RotateCcw size={18} />
              <span>重新开始</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'var(--bg-overlay-heavy)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 2000,
    animation: 'fadeIn 0.2s ease',
  },
  container: {
    background: 'var(--bg-secondary, #1a1e28)',
    borderRadius: 'var(--radius-2xl) var(--radius-2xl) 0 0',
    width: '100%',
    maxWidth: '500px',
    minHeight: '60vh',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    animation: 'slideUp var(--duration-slow) ease',
    overscrollBehavior: 'contain',
    WebkitOverflowScrolling: 'touch',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--space-lg) var(--space-xl) var(--space-md)',
    borderBottom: '1px solid var(--border, #252a38)',
  },
  title: {
    margin: 0,
    fontSize: 'var(--text-xl)',
    fontWeight: '600',
    color: 'var(--text-heading, #fff)',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted, #6b7280)',
    cursor: 'pointer',
    padding: 'var(--space-xs)',
    display: 'flex',
    alignItems: 'center',
  },
  body: {
    flex: 1,
    padding: 'var(--space-xl)',
    overflowY: 'auto',
  },
  // Idle
  idleArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
    gap: 'var(--space-md)',
  },
  hintText: {
    fontSize: 'var(--text-xl)',
    fontWeight: '500',
    color: 'var(--text-heading, #fff)',
  },
  hintSubtext: {
    fontSize: 'var(--text-base)',
    color: 'var(--text-muted, #6b7280)',
    marginBottom: 'var(--space-lg)',
  },
  examples: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-sm)',
    alignItems: 'center',
  },
  exampleItem: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-secondary, #9ca3af)',
    background: 'var(--bg-tertiary, #151820)',
    padding: 'var(--space-sm) var(--text-base)',
    borderRadius: 'var(--radius-2xl)',
  },
  // Recording
  recordingArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
    gap: 'var(--space-lg)',
  },
  waveContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-sm)',
    height: '60px',
  },
  waveBar: {
    width: '6px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--accent, #4f8ef7)',
    transition: 'height var(--duration-slow) ease',
  },
  recordingText: {
    fontSize: 'var(--text-lg)',
    fontWeight: '500',
    color: 'var(--danger)',
  },
  recordingDuration: {
    fontSize: 'var(--text-base)',
    color: 'var(--text-secondary, #9ca3af)',
    fontVariantNumeric: 'tabular-nums',
  },
  transcriptPreview: {
    fontSize: 'var(--text-md)',
    color: 'var(--text-heading, #fff)',
    textAlign: 'center',
    padding: 'var(--space-md) var(--space-base)',
    background: 'var(--bg-tertiary, #151820)',
    borderRadius: 'var(--radius-lg)',
    width: '100%',
    lineHeight: '1.6',
  },
  // Processing
  processingArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
    gap: 'var(--space-base)',
  },
  spinner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerIcon: {
    animation: 'spin 1s linear infinite',
    color: 'var(--accent, #4f8ef7)',
  },
  processingText: {
    fontSize: 'var(--text-lg)',
    fontWeight: '500',
    color: 'var(--accent, #4f8ef7)',
  },
  // Results
  resultsArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-base)',
  },
  resultHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
  },
  typeTagFood: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    padding: 'var(--space-xs) var(--space-md)',
    borderRadius: 'var(--radius-xl)',
    fontSize: 'var(--text-sm)',
    fontWeight: '600',
    background: 'var(--warning-bg)',
    color: 'var(--warning)',
  },
  typeTagExercise: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    padding: 'var(--space-xs) var(--space-md)',
    borderRadius: 'var(--radius-xl)',
    fontSize: 'var(--text-sm)',
    fontWeight: '600',
    background: 'var(--success-bg)',
    color: 'var(--success)',
  },
  typeTagMixed: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    padding: 'var(--space-xs) var(--space-md)',
    borderRadius: 'var(--radius-xl)',
    fontSize: 'var(--text-sm)',
    fontWeight: '600',
    background: 'var(--accent-bg)',
    color: 'var(--accent)',
  },
  localTag: {
    padding: 'var(--space-xs) var(--space-md)',
    borderRadius: 'var(--radius-lg)',
    fontSize: 'var(--text-xs)',
    background: 'var(--accent-bg)',
    color: 'var(--text-muted)',
  },
  transcriptBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-xs)',
    padding: 'var(--space-md)',
    background: 'var(--bg-tertiary, #151820)',
    borderRadius: 'var(--radius-md)',
  },
  transcriptLabel: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-muted, #6b7280)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  transcriptContent: {
    fontSize: 'var(--text-base)',
    color: 'var(--text-heading, #fff)',
    lineHeight: '1.5',
  },
  resultSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-sm)',
  },
  resultSectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    fontSize: 'var(--text-base)',
    fontWeight: '600',
    color: 'var(--text-heading, #fff)',
  },
  resultItem: {
    padding: 'var(--space-md)',
    background: 'var(--bg-tertiary, #151820)',
    borderRadius: 'var(--radius-md)',
  },
  resultItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 'var(--space-md)',
  },
  resultItemName: {
    fontSize: 'var(--text-md)',
    fontWeight: '500',
    color: 'var(--text-heading, #fff)',
  },
  resultItemActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
  },
  resultItemCal: {
    fontSize: 'var(--text-base)',
    fontWeight: '600',
    color: 'var(--warning)',
  },
  resultItemCalGreen: {
    fontSize: 'var(--text-base)',
    fontWeight: '600',
    color: 'var(--success)',
  },
  removeItemButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: 'var(--radius-base)',
    border: 'none',
    background: 'rgba(239, 68, 68, 0.12)',
    color: 'var(--danger)',
    cursor: 'pointer',
  },
  editorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 'var(--space-md)',
  },
  editorField: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-sm)',
    fontSize: 'var(--text-sm)',
    color: 'var(--text-secondary, #9ca3af)',
  },
  editorInput: {
    width: '100%',
    padding: 'var(--space-md) var(--space-md)',
    borderRadius: 'var(--radius-base)',
    border: '1px solid var(--border, #252a38)',
    background: 'var(--bg-secondary, #1a1e28)',
    color: 'var(--text-heading, #fff)',
    fontSize: 'var(--text-base)',
    outline: 'none',
  },
  // Error
  errorArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
    gap: 'var(--space-base)',
  },
  errorText: {
    fontSize: 'var(--text-base)',
    color: 'var(--danger)',
    textAlign: 'center',
    padding: '0 var(--space-lg)',
    lineHeight: '1.6',
  },
  // Actions
  actions: {
    padding: 'var(--space-base) var(--space-xl) calc(var(--space-2xl) + env(safe-area-inset-bottom, 0px))',
    display: 'flex',
    justifyContent: 'center',
  },
  micButton: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    background: 'var(--accent)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--shadow-button)',
    transition: 'transform var(--duration-base), box-shadow var(--duration-base)',
  },
  stopButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
  stopIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'var(--danger)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--shadow-button)',
  },
  stopLabel: {
    fontSize: 'var(--text-sm)',
    color: 'var(--danger)',
    fontWeight: '500',
  },
  resultActions: {
    display: 'flex',
    gap: 'var(--space-md)',
    width: '100%',
  },
  retryButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-sm)',
    padding: 'var(--space-base)',
    background: 'var(--bg-tertiary, #151820)',
    border: '1px solid var(--border, #252a38)',
    borderRadius: 'var(--radius-lg)',
    color: 'var(--text-heading, #fff)',
    fontSize: 'var(--text-md)',
    fontWeight: '500',
    cursor: 'pointer',
  },
  confirmButton: {
    flex: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-sm)',
    padding: 'var(--space-base)',
    background: 'var(--accent)',
    border: 'none',
    borderRadius: 'var(--radius-lg)',
    color: '#fff',
    fontSize: 'var(--text-md)',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: 'var(--shadow-button)',
    transition: 'opacity var(--duration-base) ease',
  },
  retryButtonFull: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-sm)',
    padding: 'var(--space-base) var(--space-2xl)',
    background: 'var(--bg-tertiary, #151820)',
    border: '1px solid var(--border, #252a38)',
    borderRadius: 'var(--radius-lg)',
    color: 'var(--text-heading, #fff)',
    fontSize: 'var(--text-md)',
    fontWeight: '500',
    cursor: 'pointer',
  },
};

export default VoiceRecorder;
