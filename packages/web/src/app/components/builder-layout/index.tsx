import { ApEdition, ApFlagId } from '@activepieces/shared';

import { useEmbedding } from '@/components/providers/embed-provider';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar-shadcn';
import { PurchaseExtraFlowsDialog } from '@/features/billing';
import { flagsHooks } from '@/hooks/flags-hooks';

import {
  GlobalSearchProvider,
  useGlobalSearch,
} from '../global-search/global-search-context';
import { ProjectDashboardSidebar } from '../sidebar/dashboard';

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
    <SidebarProvider hoverMode={!searchOpen} defaultOpen={false}>
      {!embedState.isEmbedded && <ProjectDashboardSidebar />}
      <SidebarInset className="flex flex-col h-full overflow-hidden bg-sidebar">
        <div className="flex-1 flex flex-col p-2 pt-3 pb-3 overflow-hidden">
          <div className="flex flex-col h-full bg-background rounded-xl shadow-[2px_0px_4px_-2px_rgba(0,0,0,0.05),0px_2px_4px_-2px_rgba(0,0,0,0.05)] border overflow-hidden">
            {children}
          </div>
        </div>
        {edition === ApEdition.CLOUD && <PurchaseExtraFlowsDialog />}
      </SidebarInset>
    </SidebarProvider>
  );
}
