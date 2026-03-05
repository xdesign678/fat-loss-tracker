import { useState } from 'react';
import { useApp } from './context/AppContext';
import SetupScreen from './components/SetupScreen';
import Dashboard from './components/Dashboard';
import FoodLogger from './components/FoodLogger';
import ExerciseLogger from './components/ExerciseLogger';
import HealthTips from './components/HealthTips';
import WeightLogger from './components/WeightLogger';
import Settings from './components/Settings';
import { Home, Utensils, Dumbbell, BookOpen, Scale, Settings as SettingsIcon } from 'lucide-react';

const tabs = [
  { id: 'dashboard', label: '仪表盘', icon: Home },
  { id: 'food', label: '饮食记录', icon: Utensils },
  { id: 'exercise', label: '运动记录', icon: Dumbbell },
  { id: 'tips', label: '知识库', icon: BookOpen },
];

function App() {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [weightModalOpen, setWeightModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (!state.setupComplete) {
    return <SetupScreen />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onOpenWeightLogger={() => setWeightModalOpen(true)} />;
      case 'food':
        return <FoodLogger />;
      case 'exercise':
        return <ExerciseLogger />;
      case 'tips':
        return <HealthTips />;
      default:
        return <Dashboard onOpenWeightLogger={() => setWeightModalOpen(true)} />;
    }
  };

  return (
    <div style={styles.container}>
      {/* Settings button */}
      <button
        onClick={() => setSettingsOpen(true)}
        style={styles.settingsBtn}
        title="AI 设置"
      >
        <SettingsIcon size={18} color={state.aiSettings?.apiKey ? '#4f8ef7' : '#6b7494'} />
      </button>

      <div style={styles.content}>
        {renderContent()}
      </div>

      {/* Bottom Navigation */}
      <nav style={styles.nav}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...styles.navBtn,
                ...(isActive ? styles.navBtnActive : {}),
              }}
            >
              <Icon
                size={20}
                color={isActive ? '#4f8ef7' : '#6b7494'}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span style={{
                ...styles.navLabel,
                color: isActive ? '#4f8ef7' : '#6b7494',
                fontWeight: isActive ? 600 : 400,
              }}>
                {tab.label}
              </span>
            </button>
          );
        })}
        {/* Weight button */}
        <button
          onClick={() => setWeightModalOpen(true)}
          style={styles.navBtn}
        >
          <Scale size={20} color="#6b7494" strokeWidth={1.8} />
          <span style={{ ...styles.navLabel, color: '#6b7494' }}>称重</span>
        </button>
      </nav>

      <WeightLogger isOpen={weightModalOpen} onClose={() => setWeightModalOpen(false)} />
      <Settings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#0d0f14',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  settingsBtn: {
    position: 'fixed',
    top: '12px',
    right: '12px',
    zIndex: 50,
    background: 'rgba(21,24,32,0.9)',
    border: '1px solid #252a38',
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
  nav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '72px',
    background: 'rgba(21,24,32,0.95)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderTop: '1px solid #252a38',
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
    background: 'rgba(79,142,247,0.1)',
  },
  navLabel: {
    fontSize: '11px',
    letterSpacing: '0.3px',
  },
};

export default App;
