import {
  DefaultErrorFunction,
  SetErrorFunction,
} from '@sinclair/typebox/errors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { EmbeddingProvider } from '@/components/embed-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

import { InitialDataGuard } from './components/intial-data-guard';
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
  return (
    <QueryClientProvider client={queryClient}>
      <EmbeddingProvider>
        <InitialDataGuard>
          <TooltipProvider>
            <ThemeProvider storageKey="vite-ui-theme">
              <ApRouter />
              <Toaster />
            </ThemeProvider>
          </TooltipProvider>
        </InitialDataGuard>
      </EmbeddingProvider>
    </QueryClientProvider>
  );
}

export default App;
