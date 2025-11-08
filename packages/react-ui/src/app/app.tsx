import {
  DefaultErrorFunction,
  SetErrorFunction,
} from '@sinclair/typebox/errors';
import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { t } from 'i18next';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { EmbeddingProvider } from '@/components/embed-provider';
import TelemetryProvider from '@/components/telemetry-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { RefreshAnalyticsProvider } from '@/features/platform-admin/components/refresh-analytics-provider';
import { api } from '@/lib/api';
import { ErrorCode, isNil, QuotaExceededParams } from '@activepieces/shared';

import { ChangelogProvider } from './components/changelog-provider';
import { EmbeddingFontLoader } from './components/embedding-font-loader';
import { InitialDataGuard } from './components/initial-data-guard';
import { ApRouter } from './router';

const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (err: Error, _, __, mutation) => {
      console.error(err);
      if (api.isApError(err, ErrorCode.QUOTA_EXCEEDED)) {
        const error = err.response?.data as QuotaExceededParams;
        toast({
          title: t('Limit Exceeded'),
          description: t(
            `You have exceeded your: ${error.params.metric} limit`,
          ),
        });
      } else if (isNil(mutation.options.onError)) {
        toast(INTERNAL_ERROR_TOAST);
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
                      <Toaster />
                      <ChangelogProvider />
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
