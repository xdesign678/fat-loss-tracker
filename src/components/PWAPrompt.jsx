import { useState, useEffect, useCallback } from 'react';
import { useRegisterSW } from '../utils/registerSW';
import { Download, Wifi, WifiOff, X } from 'lucide-react';

export default function PWAPrompt() {
  const { needRefresh, offlineReady, updateServiceWorker } = useRegisterSW();
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const [showOffline, setShowOffline] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Listen for install prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      // Don't show immediately, wait a bit
      setTimeout(() => setShowInstall(true), 3000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Show offline ready notification
  useEffect(() => {
    if (offlineReady) {
      setShowOffline(true);
      const timer = setTimeout(() => setShowOffline(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [offlineReady]);

  // Auto-update when new version available
  useEffect(() => {
    if (needRefresh) {
      updateServiceWorker(true);
    }
  }, [needRefresh, updateServiceWorker]);

  // Online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setShowInstall(false);
      setInstallPrompt(null);
    }
  }, [installPrompt]);

  const dismissInstall = useCallback(() => {
    setShowInstall(false);
    // Don't show again for this session
    setInstallPrompt(null);
  }, []);

  return (
    <>
      {/* Offline indicator bar */}
      {!isOnline && (
        <div style={styles.offlineBar}>
          <WifiOff size={14} />
          <span>离线模式</span>
        </div>
      )}

      {/* Offline ready notification */}
      {showOffline && (
        <div style={styles.notification}>
          <Wifi size={16} />
          <span>应用已可离线使用</span>
          <button onClick={() => setShowOffline(false)} style={styles.dismissBtn}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Install prompt */}
      {showInstall && (
        <div style={styles.installBanner}>
          <div style={styles.installContent}>
            <div style={styles.installIcon}>
              <Download size={20} color="var(--accent)" />
            </div>
            <div style={styles.installText}>
              <div style={styles.installTitle}>安装 Kalos</div>
              <div style={styles.installDesc}>添加到主屏幕，获得原生体验</div>
            </div>
          </div>
          <div style={styles.installActions}>
            <button onClick={dismissInstall} style={styles.installDismiss}>
              以后再说
            </button>
            <button onClick={handleInstall} style={styles.installBtn}>
              安装
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  offlineBar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10001,
    background: 'var(--warning)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '4px 0',
    paddingTop: 'calc(4px + env(safe-area-inset-top, 0px))',
    fontSize: 'var(--text-xs)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
    letterSpacing: '0.3px',
  },
  notification: {
    position: 'fixed',
    top: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10002,
    background: 'var(--success-bg)',
    color: 'var(--success)',
    border: '1px solid var(--success-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-md) var(--space-lg)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    fontSize: 'var(--text-base)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
    boxShadow: 'var(--shadow-md)',
    animation: 'toastIn 0.25s ease',
    backdropFilter: 'blur(20px)',
  },
  dismissBtn: {
    background: 'none',
    border: 'none',
    color: 'inherit',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    marginLeft: '4px',
  },
  installBanner: {
    position: 'fixed',
    bottom: 'calc(76px + env(safe-area-inset-bottom, 0px))',
    left: 'var(--space-base)',
    right: 'var(--space-base)',
    zIndex: 9999,
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)',
    padding: 'var(--space-lg)',
    boxShadow: 'var(--shadow-lg)',
    animation: 'scaleIn 0.3s ease',
    fontFamily: 'var(--font-sans)',
  },
  installContent: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-md)',
    marginBottom: 'var(--space-md)',
  },
  installIcon: {
    width: '44px',
    height: '44px',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  installText: {
    flex: 1,
  },
  installTitle: {
    fontSize: 'var(--text-md)',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '2px',
  },
  installDesc: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-secondary)',
  },
  installActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 'var(--space-sm)',
  },
  installDismiss: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: 'var(--text-sm)',
    fontWeight: 500,
    cursor: 'pointer',
    padding: 'var(--space-sm) var(--space-md)',
    borderRadius: 'var(--radius-base)',
  },
  installBtn: {
    background: 'var(--btn-primary-bg)',
    color: 'var(--btn-primary-text)',
    border: 'none',
    borderRadius: 'var(--radius-base)',
    padding: 'var(--space-sm) var(--space-lg)',
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
