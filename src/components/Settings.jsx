import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from './Toast';
import { testAIConnection, hasAIAvailable, getAIConfig } from '../utils/ai';
import { X, Plus, Trash2, Eye, EyeOff, Check, Zap } from 'lucide-react';
import { Modal } from './ui';

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
  const showToast = useToast();
  const firstInputRef = useRef(null);
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
    if (selectedModel === model) setSelectedModel(updated[0] || '');
  };

  const handleSave = () => {
    dispatch({ type: 'SET_AI_SETTINGS', payload: { apiKey, models, selectedModel } });
    setSaved(true);
    showToast('设置已保存', 'success');
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
      await testAIConnection({ apiKey, model: selectedModel, timeout: 15000 });
      setTestResult({ ok: true, msg: '连接成功' });
    } catch (e) {
      setTestResult({ ok: false, msg: e.message });
    }
    setTesting(false);
  };

  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const presetsNotAdded = PRESET_MODELS.filter((m) => !models.includes(m));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="520px">
      <div style={styles.header}>
        <h2 style={styles.title}>AI 设置</h2>
        <button style={styles.closeBtn} onClick={onClose} aria-label="关闭设置">
          <X size={20} />
        </button>
      </div>

      <div style={styles.scrollArea}>
        {/* AI Gateway Status */}
        {hasAIAvailable() && !ai.apiKey && (
          <div style={{ padding: 'var(--space-md)', background: 'var(--success-bg)', borderRadius: 'var(--radius-base)', marginBottom: 'var(--space-lg)', fontSize: 'var(--text-sm)', color: 'var(--success)', fontWeight: '500' }}>
            AI Gateway 已连接 (模型: {getAIConfig()?.model || 'N/A'})，无需额外配置即可使用 AI 功能
          </div>
        )}
        {/* API Key */}
        <div style={styles.section}>
          <label style={styles.sectionLabel}>OpenRouter API Key（可选，覆盖默认 AI Gateway）</label>
          <div style={styles.apiKeyRow}>
            <input
              ref={firstInputRef}
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              style={styles.input}
              placeholder="sk-or-v1-..."
              autoComplete="off"
            />
            <button type="button" style={styles.iconBtn} onClick={() => setShowKey(!showKey)} title={showKey ? '隐藏' : '显示'} aria-label={showKey ? '隐藏 API Key' : '显示 API Key'}>
              {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div style={styles.hint}>
            从 <span style={{ color: 'var(--accent)' }}>openrouter.ai/keys</span> 获取 API Key
          </div>
        </div>

        {/* Models */}
        <div style={styles.section}>
          <label style={styles.sectionLabel}>模型列表</label>
          {models.length > 0 && (
            <div style={styles.modelList}>
              {models.map((model) => (
                <div key={model} style={{ ...styles.modelItem, ...(selectedModel === model ? styles.modelItemSelected : {}) }}>
                  <div style={styles.modelRadio} role="button" tabIndex={0} onClick={() => setSelectedModel(model)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedModel(model); } }} aria-pressed={selectedModel === model}>
                    <div style={{ ...styles.radioOuter, borderColor: selectedModel === model ? 'var(--accent)' : 'var(--border-light)' }}>
                      {selectedModel === model && <div style={styles.radioInner} />}
                    </div>
                    <span style={styles.modelName}>{model}</span>
                  </div>
                  <button type="button" style={styles.removeBtn} onClick={(e) => { e.stopPropagation(); handleRemoveModel(model); }} aria-label={`删除模型 ${model}`}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={styles.addModelRow}>
            <input type="text" value={newModelInput} onChange={(e) => setNewModelInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddModel()} style={{ ...styles.input, flex: 1 }} placeholder="输入模型名称，如 openai/gpt-4o" />
            <button type="button" style={styles.addBtn} onClick={() => handleAddModel()} disabled={!newModelInput.trim()} aria-label="添加自定义模型">
              <Plus size={18} />
            </button>
          </div>

          {presetsNotAdded.length > 0 && (
            <>
              <div style={styles.presetLabel}>快速添加</div>
              <div style={styles.presetGrid}>
                {presetsNotAdded.map((model) => (
                  <button type="button" key={model} style={styles.presetChip} onClick={() => handleAddModel(model)} aria-label={`快速添加模型 ${model}`}>
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
            <button type="button" style={styles.testBtn} onClick={handleTestAPI} disabled={testing || !apiKey || !selectedModel}>
              <Zap size={16} />
              <span>{testing ? '测试中...' : '测试连接'}</span>
            </button>
            <button type="button" style={styles.saveBtn} onClick={handleSave}>
              <Check size={16} />
              <span>{saved ? '已保存' : '保存设置'}</span>
            </button>
          </div>
          {testResult && (
            <div style={{ ...styles.testResult, color: testResult.ok ? 'var(--success)' : 'var(--danger)', background: testResult.ok ? 'var(--success-bg)' : 'var(--danger-bg)' }}>
              {testResult.ok ? 'API 连接成功' : `失败: ${testResult.msg}`}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

const styles = {
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-base)' },
  title: { fontSize: 'var(--text-2xl)', fontWeight: '700', color: 'var(--text-heading)', margin: 0 },
  closeBtn: { background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 'var(--space-md)', minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  scrollArea: { overflowY: 'auto', flex: 1, overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' },
  section: { marginBottom: 'var(--space-xl)' },
  sectionLabel: { display: 'block', fontSize: 'var(--text-base)', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--space-md)' },
  apiKeyRow: { display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' },
  input: { padding: 'var(--space-md) var(--space-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-base)', color: 'var(--text-heading)', fontSize: 'var(--text-base)', outline: 'none', width: '100%', fontFamily: 'monospace' },
  iconBtn: { background: 'var(--border)', border: 'none', borderRadius: 'var(--radius-base)', color: 'var(--text-secondary)', cursor: 'pointer', padding: 'var(--space-md)', display: 'flex', flexShrink: 0 },
  hint: { fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 'var(--space-sm)' },
  modelList: { display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' },
  modelItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-md) var(--space-md)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-base)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all var(--duration-base)' },
  modelItemSelected: { borderColor: 'var(--accent)', background: 'var(--accent-bg)' },
  modelRadio: { display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flex: 1, minWidth: 0, cursor: 'pointer' },
  radioOuter: { width: '16px', height: '16px', borderRadius: '50%', border: '2px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  radioInner: { width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' },
  modelName: { fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  removeBtn: { background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 'var(--space-xs)', display: 'flex', flexShrink: 0, transition: 'color var(--duration-base)' },
  addModelRow: { display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' },
  addBtn: { background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-base)', color: '#fff', cursor: 'pointer', padding: 'var(--space-md)', display: 'flex', flexShrink: 0 },
  presetLabel: { fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' },
  presetGrid: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' },
  presetChip: { display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', padding: 'var(--space-xs) var(--space-md)', background: 'var(--border)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', cursor: 'pointer', transition: 'all var(--duration-base)' },
  actionRow: { display: 'flex', gap: 'var(--space-md)' },
  testBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-sm)', padding: 'var(--space-md)', background: 'var(--border)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-base)', color: 'var(--text-primary)', fontSize: 'var(--text-base)', fontWeight: '500', cursor: 'pointer' },
  saveBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-sm)', padding: 'var(--space-md)', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-base)', color: '#fff', fontSize: 'var(--text-base)', fontWeight: '500', cursor: 'pointer' },
  testResult: { marginTop: 'var(--space-md)', padding: 'var(--space-md) var(--space-md)', borderRadius: 'var(--radius-base)', fontSize: 'var(--text-sm)', fontWeight: '500' },
};

export default Settings;
