import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { formatDate } from '../utils/calculations';

const AppContext = createContext();

const STORAGE_KEY = 'fatLossTrackerData';

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) { console.error('Failed to load state', e); }
  return null;
}

const defaultState = {
  profile: {
    height: 175,
    age: 30,
    startWeight: 110,
    currentWeight: 110,
    targetWeight: 85,
    activityLevel: 'light',
    startDate: formatDate(new Date()),
  },
  dailyLogs: {},
  weightHistory: [],
  setupComplete: false,
  aiSettings: {
    apiKey: '',
    models: [],
    selectedModel: '',
  },
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_PROFILE':
      return { ...state, profile: { ...state.profile, ...action.payload }, setupComplete: true };
    case 'LOG_FOOD': {
      const date = action.payload.date;
      const existing = state.dailyLogs[date] || { foods: [], exercises: [] };
      return {
        ...state,
        dailyLogs: {
          ...state.dailyLogs,
          [date]: { ...existing, foods: [...existing.foods, action.payload.food] }
        }
      };
    }
    case 'REMOVE_FOOD': {
      const date = action.payload.date;
      const existing = state.dailyLogs[date];
      if (!existing) return state;
      const foods = existing.foods.filter((_, i) => i !== action.payload.index);
      return {
        ...state,
        dailyLogs: { ...state.dailyLogs, [date]: { ...existing, foods } }
      };
    }
    case 'LOG_EXERCISE': {
      const date = action.payload.date;
      const existing = state.dailyLogs[date] || { foods: [], exercises: [] };
      return {
        ...state,
        dailyLogs: {
          ...state.dailyLogs,
          [date]: { ...existing, exercises: [...existing.exercises, action.payload.exercise] }
        }
      };
    }
    case 'REMOVE_EXERCISE': {
      const date = action.payload.date;
      const existing = state.dailyLogs[date];
      if (!existing) return state;
      const exercises = existing.exercises.filter((_, i) => i !== action.payload.index);
      return {
        ...state,
        dailyLogs: { ...state.dailyLogs, [date]: { ...existing, exercises } }
      };
    }
    case 'LOG_WEIGHT': {
      const entry = { date: action.payload.date, weight: action.payload.weight };
      const history = [...state.weightHistory.filter(w => w.date !== entry.date), entry]
        .sort((a, b) => a.date.localeCompare(b.date));
      return {
        ...state,
        weightHistory: history,
        profile: { ...state.profile, currentWeight: action.payload.weight }
      };
    }
    case 'SET_AI_SETTINGS':
      return { ...state, aiSettings: { ...state.aiSettings, ...action.payload } };
    case 'RESET':
      return defaultState;
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, loadState() || defaultState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be within AppProvider');
  return context;
}
