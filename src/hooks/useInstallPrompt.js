import { useState, useEffect } from 'react'

/**
 * Hook que captura el evento `beforeinstallprompt` del navegador.
 * Devuelve:
 *   - canInstall: boolean — el navegador considera la app instalable
 *   - promptInstall: función — muestra el prompt nativo de instalación
 *   - handleDismiss: función — oculta el banner permanentemente
 */
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [canInstall, setCanInstall] = useState(false)
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('pwa-install-dismissed') === 'true'
  )

  useEffect(() => {
    const handler = (e) => {
      console.log('PWA: beforeinstallprompt event fired')
      e.preventDefault()
      setDeferredPrompt(e)
      setCanInstall(true)
    }

    console.log('PWA: Listening for beforeinstallprompt...')
    window.addEventListener('beforeinstallprompt', handler)

    // Si ya está instalada como PWA, no mostramos nada
    window.addEventListener('appinstalled', () => {
      console.log('PWA: App installed event fired')
      setCanInstall(false)
      setDeferredPrompt(null)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function promptInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setCanInstall(false)
      setDeferredPrompt(null)
    }
  }

  function handleDismiss() {
    localStorage.setItem('pwa-install-dismissed', 'true')
    setDismissed(true)
  }

  return { canInstall: canInstall && !dismissed, promptInstall, handleDismiss }
}
