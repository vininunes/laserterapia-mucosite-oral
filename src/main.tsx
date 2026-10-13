import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './app/app'
import { ThemeProvider } from './ui/theme/theme-provider'
import { ThemeTokensProvider } from './ui/theme/theme-tokens'

import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider surface="solid" storageKey="laser-pbm-color-scheme">
      <ThemeTokensProvider>
        <App />
      </ThemeTokensProvider>
    </ThemeProvider>
  </StrictMode>
)
