

import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip';
import { router } from './router';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';

const queryClient = new QueryClient();

export function App() {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <RouterProvider router={router} />
            <Toaster />
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </>
  );
}

export default App;
