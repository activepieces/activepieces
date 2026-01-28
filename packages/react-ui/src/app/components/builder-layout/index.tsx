import { useEmbedding } from '@/components/embed-provider';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar-shadcn';
import { PurchaseExtraFlowsDialog } from '@/features/billing/components/active-flows-addon/purchase-active-flows-dialog';
import { flagsHooks } from '@/hooks/flags-hooks';
import { ApEdition, ApFlagId } from '@activepieces/shared';

import { ProjectDashboardSidebar } from '../sidebar/dashboard';

export function BuilderLayout({ children }: { children: React.ReactNode }) {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { embedState } = useEmbedding();

  return (
    <SidebarProvider hoverMode={true} defaultOpen={false}>
      {!embedState.isEmbedded && <ProjectDashboardSidebar />}
      <SidebarInset>
        {children}
        {edition === ApEdition.CLOUD && <PurchaseExtraFlowsDialog />}
      </SidebarInset>
    </SidebarProvider>
  );
}
