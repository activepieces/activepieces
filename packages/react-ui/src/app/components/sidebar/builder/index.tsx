import { BUILDER_NAVIGATION_SIDEBAR_ID } from '@/app/builder/flow-canvas/utils/consts';
import { useEmbedding } from '@/components/embed-provider';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarProvider,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar-shadcn';
import { PurchaseExtraFlowsDialog } from '@/features/billing/components/active-flows-addon/purchase-active-flows-dialog';
import { flagsHooks } from '@/hooks/flags-hooks';
import { cn } from '@/lib/utils';
import { ApEdition, ApFlagId } from '@activepieces/shared';

import { AllowOnlyLoggedInUserOnlyGuard } from '../../allow-logged-in-user-only-guard';
import { AppSidebarHeader } from '../sidebar-header';
import { SidebarUser } from '../sidebar-user';

import { FlowsNavigation } from './flows-navigation';
import { TablesNavigation } from './tables-navigation';

function BuilderSidebarContent() {
  const { state, setOpen } = useSidebar();

  return (
    <Sidebar
      id={BUILDER_NAVIGATION_SIDEBAR_ID}
      variant="inset"
      onClick={() => setOpen(true)}
      className={cn(
        state === 'collapsed' ? 'cursor-nesw-resize' : '',
        'group',
        'p-1',
      )}
    >
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
    <AllowOnlyLoggedInUserOnlyGuard>
      <SidebarProvider keyForStateInLocalStorage="builder-sidebar">
        {!embedState.isEmbedded && <BuilderSidebarContent />}
        <SidebarInset>
          {children}
          {edition === ApEdition.CLOUD && <PurchaseExtraFlowsDialog />}
        </SidebarInset>
      </SidebarProvider>
    </AllowOnlyLoggedInUserOnlyGuard>
  );
}
