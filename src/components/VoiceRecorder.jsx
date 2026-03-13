import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, X, Check, RotateCcw, Loader, Utensils, Dumbbell } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDate } from '../utils/calculations';
import { useToast } from './Toast';

const AI_GATEWAY_URL = 'https://ai-gateway.happycapy.ai/api/v1/chat/completions';
const AI_GATEWAY_KEY = import.meta.env.VITE_AI_GATEWAY_API_KEY;

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
  const recognitionRef = useRef(null);
  const processingTimeoutRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const today = formatDate(new Date());

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setTranscript('');
      setInterimText('');
      setResults(null);
      setError('');
      setRecordingDuration(0);
    } else {
      stopRecording();
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
        processingTimeoutRef.current = null;
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  }, [isOpen]);

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

  const getSpeechRecognition = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    return new SR();
  };

  const startRecording = useCallback(() => {
    const recognition = getSpeechRecognition();
    if (!recognition) {
      setError('您的浏览器不支持语音识别，请使用 Chrome 浏览器');
      setStatus('error');
      return;
    }

    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setStatus('recording');
      setTranscript('');
      setInterimText('');
      setError('');
    };

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

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') {
        setError('未检测到语音，请再试一次');
      } else if (event.error === 'not-allowed') {
        setError('麦克风权限被拒绝，请在浏览器设置中允许');
      } else {
        setError(`语音识别出错: ${event.error}`);
      }
      setStatus('error');
    };

    recognition.onend = () => {
      // Only auto-process if we have transcript and are still in recording state
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  const handleStopAndProcess = useCallback(async () => {
    stopRecording();
    const text = transcript || interimText;
    if (!text.trim()) {
      setError('未检测到语音内容，请再试一次');
      setStatus('error');
      return;
    }
    setTranscript(text);
    setInterimText('');
    await analyzeWithAI(text);
  }, [transcript, interimText]);

  const getAPIConfig = () => {
    // Prefer AI Gateway
    if (AI_GATEWAY_KEY) {
      return { url: AI_GATEWAY_URL, key: AI_GATEWAY_KEY, model: 'anthropic/claude-haiku-4.5' };
    }
    // Fallback to user's OpenRouter settings
    const aiSettings = state.aiSettings || {};
    if (aiSettings.apiKey && aiSettings.selectedModel) {
      return {
        url: 'https://openrouter.ai/api/v1/chat/completions',
        key: aiSettings.apiKey,
        model: aiSettings.selectedModel,
      };
    }
    return null;
  };

  const analyzeWithAI = async (text) => {
    setStatus('processing');
    setError('');

    const apiConfig = getAPIConfig();
    if (!apiConfig) {
      // Local fallback
      localFallbackAnalysis(text);
      return;
    }

    try {
      const res = await fetch(apiConfig.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig.key}`,
        },
        body: JSON.stringify({
          model: apiConfig.model,
          messages: [{
            role: 'system',
            content: `你是一个健康记录助手。用户会用语音告诉你他吃了什么或做了什么运动。
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
- 只返回JSON，不要有其他文字`
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
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('AI返回格式异常');

      const parsed = JSON.parse(jsonMatch[0]);
      setResults(parsed);
      setStatus('results');
    } catch (e) {
      setError(`AI 分析失败: ${e.message}`);
      setStatus('error');
    }
  };

  const localFallbackAnalysis = (text) => {
    // Simple keyword matching
    const exerciseKeywords = ['跑步', '走路', '游泳', '骑车', '骑行', '健身', '深蹲', '俯卧撑',
      '瑜伽', '跳绳', '打球', '篮球', '足球', '羽毛球', '乒乓球', '网球',
      '拉伸', '举重', '卧推', '引体向上', '平板支撑', '开合跳', '爬楼梯',
      '散步', '慢跑', '快走', '登山', '太极', '跳舞', '运动'];
    const foodKeywords = ['吃', '喝', '早餐', '午餐', '晚餐', '零食', '饭', '面', '菜',
      '肉', '鸡', '鱼', '虾', '蛋', '奶', '茶', '咖啡', '果汁', '水果',
      '米饭', '面条', '包子', '饺子', '馒头', '粥', '汤', '沙拉', '牛排'];

    const isExercise = exerciseKeywords.some(k => text.includes(k));
    const isFood = foodKeywords.some(k => text.includes(k));

    if (isExercise && !isFood) {
      setResults({
        type: 'exercise',
        items: [{ name: text, duration: 30, calories: 150, category: '其他' }],
        isLocal: true,
      });
    } else {
      setResults({
        type: 'food',
        items: [{ name: text, grams: 100, calories: 200, protein: 10, carbs: 20, fat: 5 }],
        isLocal: true,
      });
    }
    setStatus('results');
  };

  const handleConfirm = () => {
    if (!results) return;
    const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

    if (results.type === 'food' || results.type === 'mixed') {
      const foods = results.type === 'mixed' ? results.foods : results.items;
      (foods || []).forEach(item => {
        dispatch({
          type: 'LOG_FOOD',
          payload: {
            date: today,
            food: {
              name: item.name,
              grams: item.grams || 0,
              calories: Math.round(item.calories || 0),
              protein: Math.round(item.protein || 0),
              carbs: Math.round(item.carbs || 0),
              fat: Math.round(item.fat || 0),
              time,
            },
          },
        });
      });
    }

    if (results.type === 'exercise' || results.type === 'mixed') {
      const exercises = results.type === 'mixed' ? results.exercises : results.items;
      (exercises || []).forEach(item => {
        dispatch({
          type: 'LOG_EXERCISE',
          payload: {
            date: today,
            exercise: {
              name: item.name,
              duration: item.duration || 30,
              calories: Math.round(item.calories || 0),
              category: item.category || '其他',
              time,
            },
          },
        });
      });
    }

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
              <div style={styles.processingText}>AI 正在分析...</div>
              <div style={styles.transcriptPreview}>{transcript}</div>
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
                    <Utensils size={16} color="#f59e0b" /> 饮食
                  </div>
                  {(results.type === 'mixed' ? results.foods : results.items || []).map((item, i) => (
                    <div key={i} style={styles.resultItem}>
                      <div style={styles.resultItemHeader}>
                        <span style={styles.resultItemName}>{item.name}</span>
                        <span style={styles.resultItemCal}>{Math.round(item.calories)} kcal</span>
                      </div>
                      <div style={styles.resultItemDetail}>
                        {item.grams > 0 && <span>{item.grams}g</span>}
                        {item.protein > 0 && <span>蛋白 {Math.round(item.protein)}g</span>}
                        {item.carbs > 0 && <span>碳水 {Math.round(item.carbs)}g</span>}
                        {item.fat > 0 && <span>脂肪 {Math.round(item.fat)}g</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Exercise items */}
              {(results.type === 'exercise' || results.type === 'mixed') && (
                <div style={styles.resultSection}>
                  <div style={styles.resultSectionTitle}>
                    <Dumbbell size={16} color="#2ecc71" /> 运动
                  </div>
                  {(results.type === 'mixed' ? results.exercises : results.items || []).map((item, i) => (
                    <div key={i} style={styles.resultItem}>
                      <div style={styles.resultItemHeader}>
                        <span style={styles.resultItemName}>{item.name}</span>
                        <span style={styles.resultItemCalGreen}>-{Math.round(item.calories)} kcal</span>
                      </div>
                      <div style={styles.resultItemDetail}>
                        <span>{item.duration}分钟</span>
                        <span>{item.category}</span>
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
              <button onClick={handleConfirm} style={styles.confirmButton}>
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
    borderRadius: '24px 24px 0 0',
    width: '100%',
    maxWidth: '500px',
    minHeight: '60vh',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    animation: 'slideUp 0.3s ease',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px 12px',
    borderBottom: '1px solid var(--border, #252a38)',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: 'var(--text-heading, #fff)',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted, #6b7280)',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
  },
  body: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto',
  },
  // Idle
  idleArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
    gap: '12px',
  },
  hintText: {
    fontSize: '18px',
    fontWeight: '500',
    color: 'var(--text-heading, #fff)',
  },
  hintSubtext: {
    fontSize: '14px',
    color: 'var(--text-muted, #6b7280)',
    marginBottom: '20px',
  },
  examples: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    alignItems: 'center',
  },
  exampleItem: {
    fontSize: '13px',
    color: 'var(--text-secondary, #9ca3af)',
    background: 'var(--bg-tertiary, #151820)',
    padding: '6px 14px',
    borderRadius: '20px',
  },
  // Recording
  recordingArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
    gap: '20px',
  },
  waveContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    height: '60px',
  },
  waveBar: {
    width: '6px',
    borderRadius: '3px',
    background: 'var(--accent, #4f8ef7)',
    transition: 'height 0.3s ease',
  },
  recordingText: {
    fontSize: '16px',
    fontWeight: '500',
    color: 'var(--danger)',
  },
  transcriptPreview: {
    fontSize: '15px',
    color: 'var(--text-heading, #fff)',
    textAlign: 'center',
    padding: '12px 16px',
    background: 'var(--bg-tertiary, #151820)',
    borderRadius: '12px',
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
    gap: '16px',
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
    fontSize: '16px',
    fontWeight: '500',
    color: 'var(--accent, #4f8ef7)',
  },
  // Results
  resultsArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  resultHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  typeTagFood: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    borderRadius: '16px',
    fontSize: '13px',
    fontWeight: '600',
    background: 'rgba(245, 158, 11, 0.15)',
    color: '#f59e0b',
  },
  typeTagExercise: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    borderRadius: '16px',
    fontSize: '13px',
    fontWeight: '600',
    background: 'rgba(46, 204, 113, 0.15)',
    color: '#2ecc71',
  },
  typeTagMixed: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    borderRadius: '16px',
    fontSize: '13px',
    fontWeight: '600',
    background: 'rgba(79, 142, 247, 0.15)',
    color: '#4f8ef7',
  },
  localTag: {
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    background: 'var(--accent-bg)',
    color: 'var(--text-muted)',
  },
  transcriptBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '12px',
    background: 'var(--bg-tertiary, #151820)',
    borderRadius: '10px',
  },
  transcriptLabel: {
    fontSize: '11px',
    color: 'var(--text-muted, #6b7280)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  transcriptContent: {
    fontSize: '14px',
    color: 'var(--text-heading, #fff)',
    lineHeight: '1.5',
  },
  resultSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  resultSectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text-heading, #fff)',
  },
  resultItem: {
    padding: '12px',
    background: 'var(--bg-tertiary, #151820)',
    borderRadius: '10px',
  },
  resultItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  resultItemName: {
    fontSize: '15px',
    fontWeight: '500',
    color: 'var(--text-heading, #fff)',
  },
  resultItemCal: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#f59e0b',
  },
  resultItemCalGreen: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2ecc71',
  },
  resultItemDetail: {
    display: 'flex',
    gap: '12px',
    fontSize: '13px',
    color: 'var(--text-secondary, #9ca3af)',
  },
  // Error
  errorArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
    gap: '16px',
  },
  errorText: {
    fontSize: '14px',
    color: 'var(--danger)',
    textAlign: 'center',
    padding: '0 20px',
    lineHeight: '1.6',
  },
  // Actions
  actions: {
    padding: '16px 24px 32px',
    display: 'flex',
    justifyContent: 'center',
  },
  micButton: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #4f8ef7, #6366f1)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 20px rgba(79, 142, 247, 0.4)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  stopButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
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
    boxShadow: '0 4px 20px rgba(239, 68, 68, 0.4)',
  },
  stopLabel: {
    fontSize: '13px',
    color: 'var(--danger)',
    fontWeight: '500',
  },
  resultActions: {
    display: 'flex',
    gap: '12px',
    width: '100%',
  },
  retryButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px',
    background: 'var(--bg-tertiary, #151820)',
    border: '1px solid var(--border, #252a38)',
    borderRadius: '12px',
    color: 'var(--text-heading, #fff)',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  confirmButton: {
    flex: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px',
    background: 'linear-gradient(135deg, #4f8ef7, #6366f1)',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(79, 142, 247, 0.3)',
  },
  retryButtonFull: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px 32px',
    background: 'var(--bg-tertiary, #151820)',
    border: '1px solid var(--border, #252a38)',
    borderRadius: '12px',
    color: 'var(--text-heading, #fff)',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
  },
};

export default VoiceRecorder;
