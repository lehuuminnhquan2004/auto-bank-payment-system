import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import './styles/layout.css'
import './styles/components.css'
import './styles/auth.css'
import './styles/dashboard.css'
import './styles/create-payment.css'
import './styles/payment.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
