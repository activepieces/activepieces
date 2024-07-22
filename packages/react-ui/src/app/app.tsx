import {
  DefaultErrorFunction,
  SetErrorFunction,
} from '@sinclair/typebox/errors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';

import { TextInputWithMentions } from '../features/flow-canvas/components/text-input-with-mentions';

import { router } from './router';

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
    <TextInputWithMentions className=" w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"></TextInputWithMentions>
    // <QueryClientProvider client={queryClient}>
    //   <TooltipProvider>
    //     <ThemeProvider storageKey="vite-ui-theme">
    //       <RouterProvider router={router} />
    //       <Toaster />
    //     </ThemeProvider>
    //   </TooltipProvider>
    // </QueryClientProvider>
  );
}

export default App;
