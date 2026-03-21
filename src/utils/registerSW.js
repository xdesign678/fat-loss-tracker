/**
 * Service Worker Registration Hook
 *
 * This hook wraps the vite-plugin-pwa's virtual module to provide
 * service worker registration status and update capabilities.
 *
 * Usage:
 * ```jsx
 * import { useRegisterSW } from './utils/registerSW'
 *
 * function App() {
 *   const { needRefresh, offlineReady, updateServiceWorker } = useRegisterSW()
 *
 *   // Show update prompt when needRefresh is true
 *   // Show offline ready notification when offlineReady is true
 *   // Call updateServiceWorker() to apply updates
 * }
 * ```
 */

import { useRegisterSW as usePWARegister } from 'virtual:pwa-register/react'

export function useRegisterSW() {
  const {
    needRefresh = [false],
    offlineReady = [false],
    updateServiceWorker
  } = usePWARegister({
    onRegistered(r) {
      console.log('[PWA] Service Worker registered:', r)
    },
    onRegisterError(error) {
      console.error('[PWA] Service Worker registration error:', error)
    }
  })

  return {
    needRefresh: needRefresh[0],
    offlineReady: offlineReady[0],
    updateServiceWorker
  }
}
