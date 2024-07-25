import {
  DefaultErrorFunction,
  SetErrorFunction,
} from '@sinclair/typebox/errors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';

import { InitialDataGuard } from './components/intial-data-guard';
import { router } from './router';

import { SocketProvider } from '@/components/socket-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

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
    <SocketProvider>
      <QueryClientProvider client={queryClient}>
        <InitialDataGuard>
          <TooltipProvider>
            <ThemeProvider storageKey="vite-ui-theme">
              <RouterProvider router={router} />
              <Toaster />
            </ThemeProvider>
          </TooltipProvider>
        </InitialDataGuard>
      </QueryClientProvider>
    </SocketProvider>
  );
}

export default App;
