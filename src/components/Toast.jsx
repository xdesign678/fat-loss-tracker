import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastContext = createContext();

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const removeToast = useCallback((id) => {
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }

    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 200);
  }, []);

  const showToast = useCallback((messageOrOptions, type = 'success', duration = 2500) => {
    const options = typeof messageOrOptions === 'string'
      ? { message: messageOrOptions, type, duration }
      : messageOrOptions;

    const id = Date.now() + Math.random();
    const toast = {
      id,
      message: options.message,
      type: options.type || 'success',
      duration: options.duration || 2500,
      actionLabel: options.actionLabel,
      onAction: options.onAction,
      exiting: false,
    };

    setToasts(prev => [...prev.slice(-2), toast]);
    timersRef.current[id] = setTimeout(() => removeToast(id), toast.duration);
    return id;
  }, [removeToast]);

  const handleToastAction = useCallback((toast) => {
    toast.onAction?.();
    removeToast(toast.id);
  }, [removeToast]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => { Object.values(timers).forEach(clearTimeout); };
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toasts.length > 0 && (
        <div className="toast-container" aria-live="polite" aria-atomic="true">
          {toasts.map(toast => {
            const Icon = icons[toast.type] || icons.info;
            return (
              <div
                key={toast.id}
                className={`toast-item toast-${toast.type}${toast.exiting ? ' toast-exit' : ''}`}
                role="alert"
              >
                <Icon size={16} />
                <span>{toast.message}</span>
                {toast.actionLabel && toast.onAction && (
                  <button
                    type="button"
                    className="toast-action"
                    onClick={() => handleToastAction(toast)}
                  >
                    {toast.actionLabel}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be within ToastProvider');
  return ctx;
}
