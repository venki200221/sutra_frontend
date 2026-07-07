import React from 'react'
import ReactDOM from 'react-dom/client'
// Self-hosted variable font — no runtime CDN dependency.
import '@fontsource-variable/inter'
import './index.css'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
