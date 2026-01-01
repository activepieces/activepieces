import {
  DefaultErrorFunction,
  SetErrorFunction,
} from '@sinclair/typebox/errors';
import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { EmbeddingProvider } from '@/components/embed-provider';
import TelemetryProvider from '@/components/telemetry-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { internalErrorToast, Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useManagePlanDialogStore } from '@/features/billing/lib/active-flows-addon-dialog-state';
import { RefreshAnalyticsProvider } from '@/features/platform-admin/lib/refresh-analytics-context';
import { api } from '@/lib/api';
import { ErrorCode, isNil } from '@activepieces/shared';

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
