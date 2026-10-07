import { ApEdition, ApFlagId } from '@activepieces/shared';

import { useEmbedding } from '@/components/providers/embed-provider';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar-shadcn';
import { ManagePlanDialog } from '@/features/billing';
import { flagsHooks } from '@/hooks/flags-hooks';
import { cn } from '@/lib/utils';

import {
  GlobalSearchProvider,
  useGlobalSearch,
} from '../global-search/global-search-context';
import { AppSidebar } from '../sidebar/app-sidebar';

export function BuilderLayout({ children }: { children: React.ReactNode }) {
  return (
    <GlobalSearchProvider>
      <BuilderLayoutInner>{children}</BuilderLayoutInner>
    </GlobalSearchProvider>
  );
}

function BuilderLayoutInner({ children }: { children: React.ReactNode }) {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { embedState } = useEmbedding();
  const { open: searchOpen } = useGlobalSearch();

  return (
    <div
      className={cn(
        'flex h-full w-full overflow-hidden',
        !embedState.isEmbedded && 'max-md:h-svh max-md:flex-col',
      )}
    >
      {!embedState.isEmbedded && <AppSidebar mode="app" />}
      <SidebarProvider
        hoverMode={!searchOpen}
        defaultOpen={false}
        className={cn(
          'flex-1 min-w-0 w-auto will-change-transform',
          !embedState.isEmbedded && 'max-md:h-auto max-md:min-h-0',
        )}
      >
        <SidebarInset className="flex flex-col h-full overflow-hidden bg-gray-2">
          <div
            className={cn(
              'flex-1 flex flex-col overflow-hidden',
              !embedState.isEmbedded && 'p-1.5',
            )}
          >
            <div
              className={cn(
                'flex flex-col h-full bg-gray-1 overflow-hidden',
                embedState.isEmbedded
                  ? 'border-l'
                  : 'rounded-xl shadow-panel border',
              )}
            >
              {children}
            </div>
          </div>
          {edition !== ApEdition.COMMUNITY && <ManagePlanDialog />}
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
