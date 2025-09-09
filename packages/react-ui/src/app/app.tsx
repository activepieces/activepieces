import {
  ErrorCode,
  isNil,
  QuotaExceededParams,
  ResourceLockedParams,
} from '@activepieces/shared';
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

import { ChangelogProvider } from './components/changelog-provider';
import { InitialDataGuard } from './components/initial-data-guard';
import { ApRouter } from './router';

import { ThemeProvider } from '@/components/theme-provider';
import { SidebarProvider } from '@/components/ui/sidebar-shadcn';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  INTERNAL_ERROR_TOAST,
  RESOURCE_LOCKED_MESSAGE,
  toast,
} from '@/components/ui/use-toast';
import { useManagePlanDialogStore } from '@/features/billing/components/upgrade-dialog/store';
import { RefreshAnalyticsProvider } from '@/features/platform-admin/components/refresh-analytics-provider';
import { api } from '@/lib/api';

const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (err: Error, _, __, mutation) => {
      console.error(err);
      if (api.isApError(err, ErrorCode.RESOURCE_LOCKED)) {
        const error = err.response?.data as ResourceLockedParams;
        toast(RESOURCE_LOCKED_MESSAGE(error.params.message));
      } else if (api.isApError(err, ErrorCode.QUOTA_EXCEEDED)) {
        const error = err.response?.data as QuotaExceededParams;
        const { openDialog } = useManagePlanDialogStore.getState();
        openDialog({ metric: error.params.metric });
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
        <InitialDataGuard>
          <TooltipProvider>
            <React.Fragment key={i18n.language}>
              <ThemeProvider storageKey="vite-ui-theme">
                <SidebarProvider>
                  <ApRouter />
                  <Toaster />
                  <ChangelogProvider />
                </SidebarProvider>
              </ThemeProvider>
            </React.Fragment>
          </TooltipProvider>
        </InitialDataGuard>
      </RefreshAnalyticsProvider>
    </QueryClientProvider>
  );
}

export default App;
