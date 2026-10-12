import './polyfills';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import './i18n';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

// Boot diagnostic — dynamic imports let us catch module-load failures.
(async () => {
  try {
    const { App } = await import('./app/app');
    const { acquisitionUtils } = await import('./lib/acquisition-utils');
    const { errorReporting } = await import('./lib/error-reporting');
    const { reloadOnceForStaleChunk } = await import('./lib/lazy-with-retry');

    acquisitionUtils.stashAcquisitionParams();

    window.addEventListener('vite:preloadError', (event) => {
      if (reloadOnceForStaleChunk('vite-preload')) {
        event.preventDefault();
      }
    });
    window.addEventListener('error', (event) => {
      if (errorReporting.isChunkLoadError(event.error ?? event.message)) {
        if (reloadOnceForStaleChunk('window-chunk')) return;
      }
      errorReporting.report({
        error: event.error ?? event.message,
        source: 'window-error',
      });
    });
    window.addEventListener('unhandledrejection', (event) => {
      if (errorReporting.isChunkLoadError(event.reason)) {
        if (reloadOnceForStaleChunk('window-chunk')) return;
      }
      errorReporting.report({ error: event.reason, source: 'unhandled-rejection' });
    });

    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    const stack = err instanceof Error && err.stack ? err.stack : '';
    console.error('[BOOT-FAILURE]', err);
    root.render(
      <div style={{ padding: 24, fontFamily: 'monospace', color: '#a00' }}>
        <h2>Boot failure</h2>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{msg}</pre>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: 10, color: '#666' }}>
          {stack.split('\n').slice(0, 15).join('\n')}
        </pre>
      </div>,
    );
  }
})();
