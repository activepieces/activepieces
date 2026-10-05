import { ApEdition, ApFlagId } from '@activepieces/shared';

import { useEmbedding } from '@/components/providers/embed-provider';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { ManagePlanDialog } from '@/features/billing';
import { useRailOpenState } from '@/features/workspace/lib/rail-collapsed';
import { flagsHooks } from '@/hooks/flags-hooks';

import { GlobalSearchProvider } from '../global-search/global-search-context';
import { PrimaryRail } from '../primary-rail';

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
  const rail = useRailOpenState();

  return (
    <SidebarProvider
      open={rail.open}
      onOpenChange={rail.onOpenChange}
      className="h-svh overflow-hidden"
    >
      {!embedState.isEmbedded && <PrimaryRail />}
      <SidebarInset className="min-w-0 overflow-hidden bg-gray-1">
        {children}
        {edition !== ApEdition.COMMUNITY && <ManagePlanDialog />}
      </SidebarInset>
    </SidebarProvider>
  );
}
