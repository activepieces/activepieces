import { t } from 'i18next';
import { AlertTriangle, Check, Copy, RefreshCcw } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useRouteError } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { errorReporting } from '@/lib/error-reporting';

function buildDiagnosticsText(
  error: unknown,
  componentStack?: string | null,
): string {
  const err =
    error instanceof Error
      ? error
      : new Error(String(error ?? 'Unknown error'));
  return [
    `Message: ${err.message}`,
    `URL: ${window.location.origin}${window.location.pathname}`,
    `User Agent: ${navigator.userAgent}`,
    `Time: ${new Date().toISOString()}`,
    '',
    `Stack:`,
    err.stack ?? '(no stack)',
    '',
    `Component Stack:`,
    componentStack ?? '(no component stack)',
  ].join('\n');
}

function writeToClipboard(text: string): Promise<void> {
  return (
    navigator.clipboard?.writeText(text) ??
    Promise.reject(new Error('clipboard unavailable'))
  );
}

const ErrorFallbackContent = ({
  error,
  componentStack,
}: {
  error: unknown;
  componentStack?: string | null;
}) => {
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const copyResetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isChunkError = errorReporting.isChunkLoadError(error);
  const diagnostics = buildDiagnosticsText(error, componentStack);

  useEffect(() => () => clearTimeout(copyResetTimer.current), []);

  const flashCopyState = (state: CopyState) => {
    clearTimeout(copyResetTimer.current);
    setCopyState(state);
    copyResetTimer.current = setTimeout(() => setCopyState('idle'), 3000);
  };

  const detailsLabel =
    copyState === 'copied'
      ? t('Copied')
      : copyState === 'failed'
      ? t('Failed to copy to clipboard')
      : t('Technical Details');

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md flex flex-col items-center text-center gap-6">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
          <AlertTriangle className="size-7 text-muted-foreground" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {isChunkError
              ? t('A new version is available')
              : t('Something went wrong')}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed text-balance">
            {isChunkError
              ? t(
                  'The application was updated. Please reload the page to get the latest version.',
                )
              : t(
                  'An unexpected error occurred and this page could not be displayed. Your data is safe. Please reload the page to continue.',
                )}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Button onClick={() => window.location.reload()}>
            <RefreshCcw className="size-4 mr-2" />
            {t('Reload page')}
          </Button>
          <Button variant="outline" asChild>
            <a href="/">{t('Go to home')}</a>
          </Button>
        </div>

        <div className="w-full flex flex-col gap-2 text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {detailsLabel}
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('Copy')}
              className="size-7 text-muted-foreground"
              onClick={() => {
                writeToClipboard(diagnostics)
                  .then(() => flashCopyState('copied'))
                  .catch(() => flashCopyState('failed'));
              }}
            >
              {copyState === 'copied' ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>
          <pre className="max-h-56 overflow-auto rounded-lg border bg-muted/40 p-4 font-mono text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap break-words select-all">
            {diagnostics}
          </pre>
        </div>
      </div>
    </div>
  );
};

export const GlobalErrorBoundary = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [componentStack, setComponentStack] = useState<string | null>(null);
  return (
    <ErrorBoundary
      onError={(error, info) => {
        setComponentStack(info.componentStack ?? null);
        errorReporting.report({
          error,
          componentStack: info.componentStack,
          source: 'react-error-boundary',
        });
      }}
      fallbackRender={({ error }) => (
        <ErrorFallbackContent error={error} componentStack={componentStack} />
      )}
    >
      {children}
    </ErrorBoundary>
  );
};

export const RouteErrorBoundary = () => {
  const error = useRouteError();
  useEffect(() => {
    errorReporting.report({ error, source: 'route-error' });
  }, [error]);
  return <ErrorFallbackContent error={error} />;
};

type CopyState = 'idle' | 'copied' | 'failed';
