/**
 * Data migration utilities for PWA data transfer.
 * iOS PWA standalone mode has separate storage from Safari,
 * so users need to manually export/import data.
 */

const STORAGE_KEY = 'fatLossTrackerData';
const THEME_KEY = 'fatLossTrackerTheme';
const TRANSFER_PREFIX = 'KALOS:';

/**
 * Export all app data as a transfer code string.
 * Format: "KALOS:" + base64(JSON({ data, theme, version, exportedAt }))
 */
export function exportData() {
  const data = localStorage.getItem(STORAGE_KEY);
  const theme = localStorage.getItem(THEME_KEY);
  if (!data) return null;

  const payload = JSON.stringify({
    data: JSON.parse(data),
    theme,
    version: 1,
    exportedAt: new Date().toISOString(),
  });

  return TRANSFER_PREFIX + btoa(unescape(encodeURIComponent(payload)));
}

/**
 * Import data from a transfer code string.
 * Returns { success, message, recordCount }
 */
export function importData(transferCode) {
  if (!transferCode || typeof transferCode !== 'string') {
    return { success: false, message: '请粘贴有效的迁移码' };
  }

  const code = transferCode.trim();
  if (!code.startsWith(TRANSFER_PREFIX)) {
    return { success: false, message: '无效的迁移码格式' };
  }

  try {
    const base64 = code.slice(TRANSFER_PREFIX.length);
    const json = decodeURIComponent(escape(atob(base64)));
    const payload = JSON.parse(json);

    if (!payload.data || typeof payload.data !== 'object') {
      return { success: false, message: '迁移码中无有效数据' };
    }

    // Count records for feedback
    const logs = payload.data.dailyLogs || {};
    const foodCount = Object.values(logs).reduce(
      (sum, day) => sum + (day.foods?.length || 0), 0
    );
    const exerciseCount = Object.values(logs).reduce(
      (sum, day) => sum + (day.exercises?.length || 0), 0
    );
    const weightCount = (payload.data.weightHistory || []).length;

    // Write to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload.data));
    if (payload.theme) {
      localStorage.setItem(THEME_KEY, payload.theme);
    }

    return {
      success: true,
      message: `已导入 ${foodCount} 条饮食、${exerciseCount} 条运动、${weightCount} 条体重记录`,
      recordCount: foodCount + exerciseCount + weightCount,
    };
  } catch (e) {
    return { success: false, message: '迁移码解析失败: ' + e.message };
  }
}

/**
 * Check if the app is running in PWA standalone mode.
 */
export function isStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

/**
 * Check if the app has existing user data.
 */
export function hasExistingData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return false;
    const parsed = JSON.parse(data);
    return parsed.setupComplete === true;
  } catch {
    return false;
  }
}
