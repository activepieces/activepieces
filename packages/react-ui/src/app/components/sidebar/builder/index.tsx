import { flowCanvasConsts } from '@/app/builder/flow-canvas/utils/consts';
import { useEmbedding } from '@/components/embed-provider';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarProvider,
  SidebarSeparator,
} from '@/components/ui/sidebar-shadcn';
import { PurchaseExtraFlowsDialog } from '@/features/billing/components/active-flows-addon/purchase-active-flows-dialog';
import { flagsHooks } from '@/hooks/flags-hooks';
import { ApEdition, ApFlagId } from '@activepieces/shared';

import { AppSidebarHeader } from '../sidebar-header';
import { SidebarUser } from '../sidebar-user';

import { FlowsNavigation } from './flows-navigation';
import { TablesNavigation } from './tables-navigation';

function BuilderSidebarContent() {
  return (
    <Sidebar
      id={flowCanvasConsts.BUILDER_NAVIGATION_SIDEBAR_ID}
      variant="inset"
      className="group p-1"
    >
      {/* onClick removed - handled in base Sidebar component to prevent auto-expansion on navigation */}
      <AppSidebarHeader />
      <SidebarContent className="gap-y-0">
        <FlowsNavigation />
        <SidebarSeparator className="my-2" />
        <TablesNavigation />
      </SidebarContent>
      <SidebarFooter onClick={(e) => e.stopPropagation()}>
        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  );
}

export function BuilderNavigationSidebar({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { embedState } = useEmbedding();

  return (
    <SidebarProvider>
      {!embedState.isEmbedded && <BuilderSidebarContent />}
      <SidebarInset>
        {children}
        {edition === ApEdition.CLOUD && <PurchaseExtraFlowsDialog />}
      </SidebarInset>
    </SidebarProvider>
  );
}
