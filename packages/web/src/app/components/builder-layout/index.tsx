import { ApEdition, ApFlagId } from '@activepieces/shared';

import { useEmbedding } from '@/components/providers/embed-provider';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar-shadcn';
import { ManagePlanDialog } from '@/features/billing';
import { flagsHooks } from '@/hooks/flags-hooks';
import { cn } from '@/lib/utils';

import { ChatContentColumn } from '../chat-panel/chat-content-column';
import { ChatNotch } from '../chat-panel/chat-notch';
import { ChatDock, ChatWindow } from '../chat-panel/chat-window';
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
        keyboardShortcut={embedState.isEmbedded}
        className={cn(
          'flex-1 min-w-0 w-auto will-change-transform',
          !embedState.isEmbedded && 'max-md:h-auto max-md:min-h-0',
        )}
      >
        <SidebarInset className="flex flex-col h-full overflow-hidden bg-gray-2">
          <div
            className={cn(
              'relative flex-1 flex flex-col overflow-hidden',
              // Same side gutters as the project layout (none beside the
              // sidebar, pr-2), so the docked chat and the notch land in the
              // same place on every page.
              !embedState.isEmbedded && 'py-1.5 pr-2 max-md:pl-1.5',
            )}
          >
            <div
              id={
                embedState.isEmbedded
                  ? undefined
                  : 'dashboard-content-container'
              }
              className={cn(
                'relative flex h-full bg-gray-1 overflow-clip',
                embedState.isEmbedded
                  ? 'border-l'
                  : 'rounded-xl shadow-panel border',
              )}
            >
              {!embedState.isEmbedded && <ChatDock side="left" />}
              <ChatContentColumn>{children}</ChatContentColumn>
              {!embedState.isEmbedded && <ChatDock side="right" />}
            </div>
            {!embedState.isEmbedded && (
              <>
                <ChatNotch className="bottom-1.5" />
                <ChatWindow />
              </>
            )}
          </div>
          {edition !== ApEdition.COMMUNITY && <ManagePlanDialog />}
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
