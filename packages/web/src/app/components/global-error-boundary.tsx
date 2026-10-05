import { t } from 'i18next';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useRouteError } from 'react-router-dom';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
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
    `URL: ${window.location.href}`,
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

const ErrorFallbackContent = ({
  error,
  componentStack,
}: {
  error: unknown;
  componentStack?: string | null;
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const isChunkError = errorReporting.isChunkLoadError(error);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-1 p-6">
      <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-gray-3">
          <AlertTriangle className="size-6 text-gray-11" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-base font-semibold text-gray-12">
            {isChunkError
              ? t('A new version is available')
              : t('Something went wrong')}
          </h1>
          <p className="text-sm text-balance text-gray-11">
            {isChunkError
              ? t(
                  'The application was updated. Please reload the page to get the latest version.',
                )
              : t(
                  'An unexpected error occurred and this page could not be displayed. Your data is safe. Please reload the page to continue.',
                )}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2">
          <Button onClick={() => window.location.reload()}>
            <RefreshCcw />
            {t('Reload page')}
          </Button>
          <Button variant="outline" asChild>
            <a href="/">{t('Go to home')}</a>
          </Button>
        </div>

        <div className="flex w-full flex-col items-center gap-2">
          <button
            type="button"
            className="text-sm text-gray-11 transition-colors hover:text-gray-12"
            onClick={() => setShowDetails((prev) => !prev)}
          >
            {showDetails
              ? t('Hide technical details')
              : t('Show technical details')}
          </button>
          {showDetails && (
            <div className="relative w-full text-left">
              <CopyButton
                textToCopy={buildDiagnosticsText(error, componentStack)}
                variant="ghost"
                withoutTooltip
                className="absolute top-2 right-2 text-gray-11"
              />
              <pre className="max-h-56 overflow-auto rounded-xl border bg-gray-2 p-3 pr-12 font-mono text-xs break-words whitespace-pre-wrap text-gray-11">
                {buildDiagnosticsText(error, componentStack)}
              </pre>
            </div>
          )}
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
