import { useEffect, useState } from 'react';
import { formatDate } from '../utils/calculations';

function getInitialNavigationState(allowedTabs) {
  const fallbackDate = formatDate(new Date());

  if (typeof window === 'undefined') {
    return { tab: 'dashboard', date: fallbackDate };
  }

  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab');
  const date = params.get('date');

  return {
    tab: allowedTabs.includes(tab) ? tab : 'dashboard',
    date: date || fallbackDate,
  };
}

export function usePersistentNavigationState(allowedTabs) {
  const [initialState] = useState(() => getInitialNavigationState(allowedTabs));
  const [activeTab, setActiveTab] = useState(initialState.tab);
  const [selectedDate, setSelectedDate] = useState(initialState.date);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    params.set('tab', activeTab);
    params.set('date', selectedDate);

    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
  }, [activeTab, selectedDate]);

  return {
    activeTab,
    setActiveTab,
    selectedDate,
    setSelectedDate,
  };
}
