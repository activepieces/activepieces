import { ErrorCode, isNil } from '@activepieces/shared';
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { t } from 'i18next';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { ApErrorDialog } from '@/components/custom/ap-error-dialog/ap-error-dialog';
import { useApErrorDialogStore } from '@/components/custom/ap-error-dialog/ap-error-dialog-store';
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

const MAJOR_QUERY_PREFIXES = new Set([
  'audit-logs',
  'project-releases',
  'users',
  'platform-invitations',
  'app-connections',
  'globalConnections',
  'project-members',
  'user-invitations',
  'secret-managers',
  'pieces-table',
  'templates',
  'flow-run-table',
  'trigger-status-report',
  'flows',
  'folders',
  'all-folder-contents',
  'root-flows',
  'root-tables',
  'tables',
  'user-leaderboard',
  'project-leaderboard',
]);

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      const prefix = query.queryKey[0];
      if (typeof prefix === 'string' && MAJOR_QUERY_PREFIXES.has(prefix)) {
        const { openDialog } = useApErrorDialogStore.getState();
        openDialog({
          title: t('Failed to load data'),
          description: t(
            'Something went wrong while loading your data. Your data is safe — please try again by refreshing the page.',
          ),
          error: api.isError(error) ? error.response?.data : error,
        });
      }
    },
  }),
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
                      <ApErrorDialog />
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
