import './polyfills';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';

import './i18n';
import App from './app/app';
import { errorReporting } from './lib/error-reporting';
import { reloadOnceForStaleChunk } from './lib/lazy-with-retry';

window.addEventListener('vite:preloadError', (event) => {
  if (reloadOnceForStaleChunk('vite-preload')) {
    event.preventDefault();
  }
});

window.addEventListener('error', (event) => {
  if (errorReporting.isChunkLoadError(event.error ?? event.message)) {
    if (reloadOnceForStaleChunk('window-chunk')) {
      return;
    }
  }
  errorReporting.report({
    error: event.error ?? event.message,
    source: 'window-error',
  });
});

window.addEventListener('unhandledrejection', (event) => {
  if (errorReporting.isChunkLoadError(event.reason)) {
    if (reloadOnceForStaleChunk('window-chunk')) {
      return;
    }
  }
  errorReporting.report({ error: event.reason, source: 'unhandled-rejection' });
});

// Canary transparent frontend: once the ap_canary cookie is set, reload once into the canary bundle.
// Guarded to one reload/session so the canary bundle doesn't loop. See .agents/features/canary.md.
const hasCanaryCookie = document.cookie
  .split('; ')
  .some((entry) => entry.startsWith('ap_canary='));

if (!hasCanaryCookie || !reloadOnceForStaleChunk('canary-bundle-swap')) {
  const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement,
  );
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
