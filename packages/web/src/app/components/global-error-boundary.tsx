import { t } from 'i18next';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
  ErrorBoundary,
  FallbackProps,
  ErrorBoundaryPropsWithComponent,
} from 'react-error-boundary';
import { useRouteError } from 'react-router-dom';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { Button } from '@/components/ui/button';
import { errorReporting } from '@/lib/error-reporting';

let lastComponentStack: string | null = null;

function buildDiagnosticsText(error: unknown): string {
  const err =
    error instanceof Error
      ? error
      : new Error(String(error ?? 'Unknown error'));
  return [
    `Message: ${err.message}`,
    `URL: ${window.location.href}`,
    `User Agent: ${navigator.userAgent}`,
    `Time: ${new Date().toISOString()}`,
    '',
    `Stack:`,
    err.stack ?? '(no stack)',
    '',
    `Component Stack:`,
    lastComponentStack ?? '(no component stack)',
  ].join('\n');
}

const ErrorFallbackContent = ({ error }: { error: unknown }) => {
  const [showDetails, setShowDetails] = useState(false);
  const isChunkError = errorReporting.isChunkLoadError(error);

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

        <div className="w-full flex flex-col items-center gap-3">
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowDetails((prev) => !prev)}
          >
            {showDetails
              ? t('Hide technical details')
              : t('Show technical details')}
          </button>
          {showDetails && (
            <div className="relative w-full text-left">
              <CopyButton
                textToCopy={buildDiagnosticsText(error)}
                variant="ghost"
                withoutTooltip
                className="absolute right-2 top-2 size-7 text-muted-foreground"
              />
              <pre className="max-h-56 overflow-auto rounded-lg border bg-muted/40 p-4 pr-12 font-mono text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap break-words">
                {buildDiagnosticsText(error)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const GlobalErrorFallback = ({ error }: FallbackProps) => (
  <ErrorFallbackContent error={error} />
);

const onError: ErrorBoundaryPropsWithComponent['onError'] = (error, info) => {
  lastComponentStack = info.componentStack ?? null;
  errorReporting.report({
    error,
    componentStack: info.componentStack,
    source: 'react-error-boundary',
  });
};

export const GlobalErrorBoundary = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <ErrorBoundary FallbackComponent={GlobalErrorFallback} onError={onError}>
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
