import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { PlayerProvider } from './store';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PlayerProvider>
      <App />
    </PlayerProvider>
  </React.StrictMode>
);

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  const hadController = Boolean(navigator.serviceWorker.controller);
  let reloaded = false;

  // 新版本接管时自动刷新一次，避免用户一直停在旧版
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloaded) return;
    reloaded = true;
    location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { updateViaCache: 'none' })
      .then((reg) => reg.update().catch(() => {}))
      .catch(() => {});
  });
}
