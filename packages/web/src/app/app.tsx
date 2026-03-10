import { ErrorCode, isNil } from '@activepieces/shared';
import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { EmbeddingProvider } from '@/components/providers/embed-provider';
import TelemetryProvider from '@/components/providers/telemetry-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { internalErrorToast, Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useManagePlanDialogStore } from '@/features/billing';
import { RefreshAnalyticsProvider } from '@/features/platform-admin';
import { api } from '@/lib/api';

import { EmbeddingFontLoader } from './components/embedding-font-loader';
import { InitialDataGuard } from './components/initial-data-guard';
import { ApRouter } from './guards';

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

export function App() {
  const { i18n } = useTranslation();
  return (
    <QueryClientProvider client={queryClient}>
      <RefreshAnalyticsProvider>
        <EmbeddingProvider>
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
        </EmbeddingProvider>
      </RefreshAnalyticsProvider>
    </QueryClientProvider>
  );
}

export default App;
