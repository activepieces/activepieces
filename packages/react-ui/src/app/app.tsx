import {
  DefaultErrorFunction,
  SetErrorFunction,
} from '@sinclair/typebox/errors';
import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { EmbeddingProvider, useEmbedding } from '@/components/embed-provider';
import TelemetryProvider from '@/components/telemetry-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { internalErrorToast, Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useManagePlanDialogStore } from '@/features/billing/lib/active-flows-addon-dialog-state';
import { RefreshAnalyticsProvider } from '@/features/platform-admin/lib/refresh-analytics-context';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { ErrorCode, isNil } from '@activepieces/shared';

import { EmbeddingFontLoader } from './components/embedding-font-loader';
import { InitialDataGuard } from './components/initial-data-guard';
import { ApRouter } from './guards';

// Component to handle token from URL for embedding
function UrlTokenHandler({ children }: { children: React.ReactNode }) {
  const { setEmbedState } = useEmbedding();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const projectId = urlParams.get('projectId');

    if (token) {
      // Save the token to session storage (embedding mode)
      // Cast to any since we only need token and projectId for saveResponse
      authenticationSession.saveResponse(
        { token, projectId: projectId || '' } as any,
        true // isEmbedding = true to use sessionStorage
      );

      // Set embedding state
      setEmbedState((prev) => ({
        ...prev,
        isEmbedded: true,
        hideSideNav: urlParams.get('hideSideNav') === 'true',
        hidePageHeader: urlParams.get('hidePageHeader') === 'true',
      }));

      // Clean up URL by removing token params
      urlParams.delete('token');
      urlParams.delete('projectId');
      const newUrl = urlParams.toString()
        ? `${window.location.pathname}?${urlParams.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [setEmbedState]);

  return <>{children}</>;
}

const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (err: Error, _, __, mutation) => {
      if (api.isApError(err, ErrorCode.QUOTA_EXCEEDED)) {
        const { openDialog } = useManagePlanDialogStore.getState();
        openDialog();
      } else if (isNil(mutation.options.onError)) {
        internalErrorToast();
      }
    },
  }),
});

let typesFormatsAdded = false;

if (!typesFormatsAdded) {
  SetErrorFunction((error) => {
    return error?.schema?.errorMessage ?? DefaultErrorFunction(error);
  });
  typesFormatsAdded = true;
}

export function App() {
  const { i18n } = useTranslation();
  return (
    <QueryClientProvider client={queryClient}>
      <RefreshAnalyticsProvider>
        <EmbeddingProvider>
          <UrlTokenHandler>
            <InitialDataGuard>
              <EmbeddingFontLoader>
                <TelemetryProvider>
                  <TooltipProvider>
                    <React.Fragment key={i18n.language}>
                      <ThemeProvider storageKey="vite-ui-theme">
                        <ApRouter />
                        <Toaster position="bottom-right" />
                      </ThemeProvider>
                    </React.Fragment>
                  </TooltipProvider>
                </TelemetryProvider>
              </EmbeddingFontLoader>
            </InitialDataGuard>
          </UrlTokenHandler>
        </EmbeddingProvider>
      </RefreshAnalyticsProvider>
    </QueryClientProvider>
  );
}

export default App;
