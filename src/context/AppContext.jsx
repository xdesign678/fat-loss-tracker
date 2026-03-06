import { createContext, useContext, useReducer, useEffect } from 'react';
import { formatDate } from '../utils/calculations';

const AppContext = createContext();

const STORAGE_KEY = 'fatLossTrackerData';
let entrySeed = 0;

function createEntryId(type) {
  entrySeed += 1;
  return `${type}-${Date.now()}-${entrySeed}`;
}

function normalizeEntry(entry, type, date, index) {
  if (!entry || typeof entry !== 'object') {
    return { id: `${type}-${date}-${index}` };
  }

  return {
    ...entry,
    id: entry.id || `${type}-${date}-${index}-${entry.name || 'item'}`,
  };
}

function normalizeDailyLogs(dailyLogs) {
  if (!dailyLogs || typeof dailyLogs !== 'object') return {};

  return Object.fromEntries(
    Object.entries(dailyLogs).map(([date, log]) => [
      date,
      {
        foods: Array.isArray(log?.foods)
          ? log.foods.map((food, index) => normalizeEntry(food, 'food', date, index))
          : [],
        exercises: Array.isArray(log?.exercises)
          ? log.exercises.map((exercise, index) => normalizeEntry(exercise, 'exercise', date, index))
          : [],
      },
    ])
  );
}

export function createDefaultState() {
  return {
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
}

export function normalizeState(savedState) {
  const defaults = createDefaultState();

  if (!savedState || typeof savedState !== 'object') {
    return defaults;
  }

  return {
    ...defaults,
    ...savedState,
    profile: {
      ...defaults.profile,
      ...(savedState.profile || {}),
    },
    dailyLogs: normalizeDailyLogs(savedState.dailyLogs),
    weightHistory: Array.isArray(savedState.weightHistory)
      ? savedState.weightHistory
      : [],
    aiSettings: {
      ...defaults.aiSettings,
      ...(savedState.aiSettings || {}),
      models: Array.isArray(savedState.aiSettings?.models)
        ? savedState.aiSettings.models
        : [],
    },
    setupComplete: Boolean(savedState.setupComplete),
  };
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return normalizeState(JSON.parse(saved));
  } catch (e) { console.error('Failed to load state', e); }
  return null;
}

export function reducer(state, action) {
  switch (action.type) {
    case 'SET_PROFILE':
      return { ...state, profile: { ...state.profile, ...action.payload }, setupComplete: true };
    case 'LOG_FOOD': {
      const date = action.payload.date;
      const existing = state.dailyLogs[date] || { foods: [], exercises: [] };
      const food = {
        ...action.payload.food,
        id: createEntryId('food'),
      };
      return {
        ...state,
        dailyLogs: {
          ...state.dailyLogs,
          [date]: { ...existing, foods: [...existing.foods, food] }
        }
      };
    }
    case 'REMOVE_FOOD': {
      const date = action.payload.date;
      const existing = state.dailyLogs[date];
      if (!existing) return state;
      const foods = existing.foods.filter((food, i) => (
        action.payload.id ? food.id !== action.payload.id : i !== action.payload.index
      ));
      return {
        ...state,
        dailyLogs: { ...state.dailyLogs, [date]: { ...existing, foods } }
      };
    }
    case 'UPDATE_FOOD': {
      const date = action.payload.date;
      const existing = state.dailyLogs[date];
      if (!existing) return state;
      const foods = existing.foods.map((food) => (
        food.id === action.payload.id
          ? { ...food, ...action.payload.food, id: food.id }
          : food
      ));
      return {
        ...state,
        dailyLogs: { ...state.dailyLogs, [date]: { ...existing, foods } }
      };
    }
    case 'LOG_EXERCISE': {
      const date = action.payload.date;
      const existing = state.dailyLogs[date] || { foods: [], exercises: [] };
      const exercise = {
        ...action.payload.exercise,
        id: createEntryId('exercise'),
      };
      return {
        ...state,
        dailyLogs: {
          ...state.dailyLogs,
          [date]: { ...existing, exercises: [...existing.exercises, exercise] }
        }
      };
    }
    case 'REMOVE_EXERCISE': {
      const date = action.payload.date;
      const existing = state.dailyLogs[date];
      if (!existing) return state;
      const exercises = existing.exercises.filter((exercise, i) => (
        action.payload.id ? exercise.id !== action.payload.id : i !== action.payload.index
      ));
      return {
        ...state,
        dailyLogs: { ...state.dailyLogs, [date]: { ...existing, exercises } }
      };
    }
    case 'UPDATE_EXERCISE': {
      const date = action.payload.date;
      const existing = state.dailyLogs[date];
      if (!existing) return state;
      const exercises = existing.exercises.map((exercise) => (
        exercise.id === action.payload.id
          ? { ...exercise, ...action.payload.exercise, id: exercise.id }
          : exercise
      ));
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
      return createDefaultState();
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, loadState() || createDefaultState());

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
