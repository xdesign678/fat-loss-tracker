import { Suspense, lazy, useState } from 'react';
import { useApp } from './context/AppContext';
import { useTheme } from './context/ThemeContext';
import SetupScreen from './components/SetupScreen';
import VoiceRecorder from './components/VoiceRecorder';
import { formatDate } from './utils/calculations';
import { Home, Utensils, Dumbbell, BookOpen, Mic, Settings as SettingsIcon, Sun, Moon } from 'lucide-react';

const Dashboard = lazy(() => import('./components/Dashboard'));
const FoodLogger = lazy(() => import('./components/FoodLogger'));
const ExerciseLogger = lazy(() => import('./components/ExerciseLogger'));
const HealthTips = lazy(() => import('./components/HealthTips'));
const WeightLogger = lazy(() => import('./components/WeightLogger'));
const Settings = lazy(() => import('./components/Settings'));

const leftTabs = [
  { id: 'dashboard', label: '仪表盘', icon: Home },
  { id: 'food', label: '饮食', icon: Utensils },
];

const rightTabs = [
  { id: 'exercise', label: '运动', icon: Dumbbell },
  { id: 'tips', label: '知识库', icon: BookOpen },
];

function App() {
  const { state } = useApp();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [weightModalOpen, setWeightModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => formatDate(new Date()));

  if (!state.setupComplete) {
    return <SetupScreen />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onOpenWeightLogger={() => setWeightModalOpen(true)}
          />
        );
      case 'food':
        return <FoodLogger selectedDate={selectedDate} onDateChange={setSelectedDate} />;
      case 'exercise':
        return <ExerciseLogger selectedDate={selectedDate} onDateChange={setSelectedDate} />;
      case 'tips':
        return <HealthTips />;
      default:
        return (
          <Dashboard
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onOpenWeightLogger={() => setWeightModalOpen(true)}
          />
        );
    }
  };

  return (
    <div style={styles.container}>
      {/* Top right buttons */}
      <div style={styles.topButtons}>
        <button
          type="button"
          onClick={toggleTheme}
          style={styles.topBtn}
          title={theme === 'dark' ? '切换浅色模式' : '切换深色模式'}
          aria-label="切换主题"
        >
          {theme === 'dark'
            ? <Sun size={18} color="var(--text-muted)" />
            : <Moon size={18} color="var(--text-muted)" />
          }
        </button>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          style={styles.topBtn}
          title="AI 设置"
          aria-label="打开 AI 设置"
        >
          <SettingsIcon size={18} color={state.aiSettings?.apiKey ? 'var(--accent)' : 'var(--text-nav)'} />
        </button>
      </div>

      <div style={styles.content}>
        <Suspense fallback={<div style={styles.loadingPanel}>页面加载中...</div>}>
          {renderContent()}
        </Suspense>
      </div>

      {/* Bottom Navigation */}
      <nav style={styles.nav}>
        {leftTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...styles.navBtn,
                ...(isActive ? styles.navBtnActive : {}),
              }}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                size={20}
                color={isActive ? 'var(--accent)' : 'var(--text-nav)'}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span style={{
                ...styles.navLabel,
                color: isActive ? 'var(--accent)' : 'var(--text-nav)',
                fontWeight: isActive ? 600 : 400,
              }}>
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* Center voice button */}
        <button
          type="button"
          onClick={() => setVoiceModalOpen(true)}
          style={styles.voiceBtn}
          aria-label="语音记录"
        >
          <div style={styles.voiceBtnInner}>
            <Mic size={24} color="#fff" strokeWidth={2.2} />
          </div>
          <span style={styles.voiceLabel}>语音</span>
        </button>

        {rightTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...styles.navBtn,
                ...(isActive ? styles.navBtnActive : {}),
              }}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                size={20}
                color={isActive ? 'var(--accent)' : 'var(--text-nav)'}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span style={{
                ...styles.navLabel,
                color: isActive ? 'var(--accent)' : 'var(--text-nav)',
                fontWeight: isActive ? 600 : 400,
              }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      <Suspense fallback={null}>
        {weightModalOpen && (
          <WeightLogger isOpen={weightModalOpen} onClose={() => setWeightModalOpen(false)} />
        )}
        {settingsOpen && (
          <Settings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
        )}
      </Suspense>
      <VoiceRecorder isOpen={voiceModalOpen} onClose={() => setVoiceModalOpen(false)} />
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'var(--bg-primary)',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  topButtons: {
    position: 'fixed',
    top: '12px',
    right: '12px',
    zIndex: 50,
    display: 'flex',
    gap: '8px',
  },
  topBtn: {
    background: 'var(--bg-blur)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
  },
  content: {
    flex: 1,
    paddingBottom: '80px',
    overflowY: 'auto',
  },
  loadingPanel: {
    minHeight: '40vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-secondary)',
    fontSize: '14px',
  },
  nav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '72px',
    background: 'var(--bg-nav)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: '0 8px',
    zIndex: 100,
  },
  navBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px 12px',
    borderRadius: '12px',
    transition: 'all 0.2s',
  },
  navBtnActive: {
    background: 'var(--accent-bg)',
  },
  navLabel: {
    fontSize: '11px',
    letterSpacing: '0.3px',
  },
  voiceBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0',
    marginTop: '-28px',
    position: 'relative',
  },
  voiceBtnInner: {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #4f8ef7, #6366f1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 16px rgba(79, 142, 247, 0.4)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  voiceLabel: {
    fontSize: '10px',
    color: 'var(--text-nav)',
    letterSpacing: '0.3px',
    marginTop: '2px',
  },
};

export default App;
