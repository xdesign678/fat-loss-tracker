import { Suspense, lazy, useState, Component } from 'react';
import { useApp } from './context/AppContext';
import { useTheme } from './context/ThemeContext';
import SetupScreen from './components/SetupScreen';
import VoiceRecorder from './components/VoiceRecorder';
import { usePersistentNavigationState } from './hooks/usePersistentNavigationState';
import { Home, Utensils, Dumbbell, BookOpen, Mic, Settings as SettingsIcon, Sun, Moon } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('ErrorBoundary caught:', error, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, color: 'var(--danger)', background: 'var(--bg-primary)', minHeight: '100vh' }}>
          <h2>Something went wrong</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{this.state.error.message}{'\n'}{this.state.error.stack}</pre>
          <button onClick={() => this.setState({ error: null })} style={{ marginTop: 16, padding: '8px 16px' }}>Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}

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

const ALL_TABS = [...leftTabs, ...rightTabs].map((tab) => tab.id);

function App() {
  const { state } = useApp();
  const { theme, toggleTheme } = useTheme();
  const { activeTab, setActiveTab, selectedDate, setSelectedDate } = usePersistentNavigationState(ALL_TABS);
  const [weightModalOpen, setWeightModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);

  if (!state.setupComplete) {
    return <SetupScreen />;
  }

  const renderContent = () => {
    let content;
    switch (activeTab) {
      case 'dashboard':
        content = (
          <Dashboard
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onOpenWeightLogger={() => setWeightModalOpen(true)}
          />
        );
        break;
      case 'food':
        content = <FoodLogger selectedDate={selectedDate} onDateChange={setSelectedDate} />;
        break;
      case 'exercise':
        content = <ExerciseLogger selectedDate={selectedDate} onDateChange={setSelectedDate} />;
        break;
      case 'tips':
        content = <HealthTips />;
        break;
      default:
        content = (
          <Dashboard
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onOpenWeightLogger={() => setWeightModalOpen(true)}
          />
        );
    }
    return (
      <div key={activeTab} className="tab-content">
        {content}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {/* Top right buttons */}
      <div style={styles.topButtons}>
        <button
          type="button"
          onClick={toggleTheme}
          style={styles.topBtn}
          className="btn-interactive"
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
          className="btn-interactive"
          title="AI 设置"
          aria-label="打开 AI 设置"
        >
          <SettingsIcon size={18} color={state.aiSettings?.apiKey ? 'var(--accent)' : 'var(--text-nav)'} />
        </button>
      </div>

      <div style={styles.content}>
        <ErrorBoundary>
          <Suspense fallback={<div style={styles.loadingPanel}>页面加载中...</div>}>
            {renderContent()}
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* Bottom Navigation */}
      <nav className="nav-safe-area" style={styles.nav}>
        {leftTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="nav-btn-hover"
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
          className="btn-interactive"
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
              className="nav-btn-hover"
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
    paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
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
    background: 'var(--accent-gradient)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--shadow-button)',
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
