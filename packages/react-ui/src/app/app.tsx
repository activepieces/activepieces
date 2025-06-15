import {
  DefaultErrorFunction,
  SetErrorFunction,
} from '@sinclair/typebox/errors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { EmbeddingProvider } from '@/components/embed-provider';
import TelemetryProvider from '@/components/telemetry-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { SidebarProvider } from '@/components/ui/sidebar-shadcn';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

import { ChangelogProvider } from './components/changelog-provider';
import { EmbeddingFontLoader } from './components/embedding-font-loader';
import { InitialDataGuard } from './components/initial-data-guard';
import { ApRouter } from './router';

const queryClient = new QueryClient();
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
      <EmbeddingProvider>
        <InitialDataGuard>
          <EmbeddingFontLoader>
            <TelemetryProvider>
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
            </TelemetryProvider>
          </EmbeddingFontLoader>
        </InitialDataGuard>
      </EmbeddingProvider>
    </QueryClientProvider>
  );
}

export default App;
