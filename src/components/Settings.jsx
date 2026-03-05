import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Plus, Trash2, Eye, EyeOff, Check, Zap } from 'lucide-react';

const PRESET_MODELS = [
  'google/gemini-2.0-flash-001',
  'openai/gpt-4o-mini',
  'openai/gpt-4o',
  'anthropic/claude-3.5-sonnet',
  'anthropic/claude-3-haiku',
  'deepseek/deepseek-chat-v3-0324',
  'meta-llama/llama-3.1-70b-instruct',
  'qwen/qwen-2.5-72b-instruct',
];

const Settings = ({ isOpen, onClose }) => {
  const { state, dispatch } = useApp();
  const ai = state.aiSettings || { apiKey: '', models: [], selectedModel: '' };

  const [apiKey, setApiKey] = useState(ai.apiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [models, setModels] = useState(ai.models?.length ? ai.models : []);
  const [selectedModel, setSelectedModel] = useState(ai.selectedModel || '');
  const [newModelInput, setNewModelInput] = useState('');
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const handleAddModel = (modelName) => {
    const name = (modelName || newModelInput).trim();
    if (!name || models.includes(name)) return;
    const updated = [...models, name];
    setModels(updated);
    if (!selectedModel) setSelectedModel(name);
    setNewModelInput('');
  };

  const handleRemoveModel = (model) => {
    const updated = models.filter((m) => m !== model);
    setModels(updated);
    if (selectedModel === model) {
      setSelectedModel(updated[0] || '');
    }
  };

  const handleSave = () => {
    dispatch({
      type: 'SET_AI_SETTINGS',
      payload: { apiKey, models, selectedModel },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTestAPI = async () => {
    if (!apiKey || !selectedModel) {
      setTestResult({ ok: false, msg: '请先填写 API Key 并选择模型' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: 'user', content: 'Reply with just "ok"' }],
          max_tokens: 5,
        }),
      });
      if (res.ok) {
        setTestResult({ ok: true, msg: '连接成功' });
      } else {
        const err = await res.json().catch(() => ({}));
        setTestResult({ ok: false, msg: err.error?.message || `HTTP ${res.status}` });
      }
    } catch (e) {
      setTestResult({ ok: false, msg: e.message });
    }
    setTesting(false);
  };

  if (!isOpen) return null;

  const presetsNotAdded = PRESET_MODELS.filter((m) => !models.includes(m));

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>AI 设置</h2>
          <button style={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div style={styles.scrollArea}>
          {/* API Key */}
          <div style={styles.section}>
            <label style={styles.sectionLabel}>OpenRouter API Key</label>
            <div style={styles.apiKeyRow}>
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                style={styles.input}
                placeholder="sk-or-v1-..."
              />
              <button
                style={styles.iconBtn}
                onClick={() => setShowKey(!showKey)}
                title={showKey ? '隐藏' : '显示'}
              >
                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div style={styles.hint}>
              从{' '}
              <span style={{ color: '#4f8ef7' }}>openrouter.ai/keys</span>
              {' '}获取 API Key
            </div>
          </div>

          {/* Models */}
          <div style={styles.section}>
            <label style={styles.sectionLabel}>模型列表</label>

            {/* Added models */}
            {models.length > 0 && (
              <div style={styles.modelList}>
                {models.map((model) => (
                  <div
                    key={model}
                    style={{
                      ...styles.modelItem,
                      ...(selectedModel === model ? styles.modelItemSelected : {}),
                    }}
                    onClick={() => setSelectedModel(model)}
                  >
                    <div style={styles.modelRadio}>
                      <div
                        style={{
                          ...styles.radioOuter,
                          borderColor: selectedModel === model ? '#4f8ef7' : '#3a3f52',
                        }}
                      >
                        {selectedModel === model && <div style={styles.radioInner} />}
                      </div>
                      <span style={styles.modelName}>{model}</span>
                    </div>
                    <button
                      style={styles.removeBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveModel(model);
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add custom model */}
            <div style={styles.addModelRow}>
              <input
                type="text"
                value={newModelInput}
                onChange={(e) => setNewModelInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddModel()}
                style={{ ...styles.input, flex: 1 }}
                placeholder="输入模型名称，如 openai/gpt-4o"
              />
              <button
                style={styles.addBtn}
                onClick={() => handleAddModel()}
                disabled={!newModelInput.trim()}
              >
                <Plus size={18} />
              </button>
            </div>

            {/* Preset models */}
            {presetsNotAdded.length > 0 && (
              <>
                <div style={styles.presetLabel}>快速添加</div>
                <div style={styles.presetGrid}>
                  {presetsNotAdded.map((model) => (
                    <button
                      key={model}
                      style={styles.presetChip}
                      onClick={() => handleAddModel(model)}
                    >
                      <Plus size={12} />
                      <span>{model.split('/')[1] || model}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Test & Save */}
          <div style={styles.section}>
            <div style={styles.actionRow}>
              <button
                style={styles.testBtn}
                onClick={handleTestAPI}
                disabled={testing || !apiKey || !selectedModel}
              >
                <Zap size={16} />
                <span>{testing ? '测试中...' : '测试连接'}</span>
              </button>
              <button
                style={styles.saveBtn}
                onClick={handleSave}
              >
                <Check size={16} />
                <span>{saved ? '已保存' : '保存设置'}</span>
              </button>
            </div>
            {testResult && (
              <div
                style={{
                  ...styles.testResult,
                  color: testResult.ok ? '#2ecc71' : '#ef4444',
                  background: testResult.ok
                    ? 'rgba(46,204,113,0.1)'
                    : 'rgba(239,68,68,0.1)',
                }}
              >
                {testResult.ok ? 'API 连接成功' : `失败: ${testResult.msg}`}
              </div>
            )}
          </div>
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
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    background: '#1a1e28',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '520px',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px 0',
  },
  title: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#fff',
    margin: 0,
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
  },
  scrollArea: {
    padding: '20px 24px 24px',
    overflowY: 'auto',
    flex: 1,
  },
  section: {
    marginBottom: '24px',
  },
  sectionLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#e8eaf0',
    marginBottom: '10px',
  },
  apiKeyRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  input: {
    padding: '10px 12px',
    background: '#151820',
    border: '1px solid #252a38',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    fontFamily: 'monospace',
  },
  iconBtn: {
    background: '#252a38',
    border: 'none',
    borderRadius: '8px',
    color: '#9ca3af',
    cursor: 'pointer',
    padding: '10px',
    display: 'flex',
    flexShrink: 0,
  },
  hint: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '6px',
  },
  modelList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '12px',
  },
  modelItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    background: '#151820',
    borderRadius: '8px',
    border: '1px solid #252a38',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  modelItemSelected: {
    borderColor: '#4f8ef7',
    background: 'rgba(79,142,247,0.08)',
  },
  modelRadio: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flex: 1,
    minWidth: 0,
  },
  radioOuter: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    border: '2px solid #3a3f52',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioInner: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#4f8ef7',
  },
  modelName: {
    fontSize: '13px',
    color: '#e8eaf0',
    fontFamily: 'monospace',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  removeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#6b7280',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    flexShrink: 0,
    transition: 'color 0.2s',
  },
  addModelRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
  },
  addBtn: {
    background: '#4f8ef7',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    cursor: 'pointer',
    padding: '10px',
    display: 'flex',
    flexShrink: 0,
  },
  presetLabel: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '8px',
  },
  presetGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  presetChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '5px 10px',
    background: '#252a38',
    border: '1px solid #3a3f52',
    borderRadius: '6px',
    color: '#9ca3af',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  actionRow: {
    display: 'flex',
    gap: '10px',
  },
  testBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '12px',
    background: '#252a38',
    border: '1px solid #3a3f52',
    borderRadius: '8px',
    color: '#e8eaf0',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  saveBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '12px',
    background: '#4f8ef7',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  testResult: {
    marginTop: '10px',
    padding: '10px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
  },
};

export default Settings;
