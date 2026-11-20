import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import '@fontsource-variable/geist-mono'
import 'dialkit/styles.css'
import './index.css'
import './cursors'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Analytics />
  </StrictMode>,
)
