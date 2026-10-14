import { useCallback, useSyncExternalStore } from 'react'

/**
 * Layout de celular: abaixo do breakpoint `md` do Tailwind ou em tela baixa
 * (celular deitado), onde os painéis flutuantes cobririam a cena.
 */
export const MOBILE_QUERY = '(max-width: 767.98px), (max-height: 500px)'

export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (notify: () => void) => {
      const media = window.matchMedia(query)
      media.addEventListener('change', notify)
      return () => media.removeEventListener('change', notify)
    },
    [query]
  )
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches)
}
