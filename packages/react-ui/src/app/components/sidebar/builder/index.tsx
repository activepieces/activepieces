import { BUILDER_NAVIGATION_SIDEBAR_ID } from '@/app/builder/flow-canvas/utils/consts';
import { useEmbedding } from '@/components/embed-provider';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarProvider,
  SidebarSeparator,
} from '@/components/ui/sidebar-shadcn';

import { AllowOnlyLoggedInUserOnlyGuard } from '../../allow-logged-in-user-only-guard';
import { AppSidebarHeader } from '../sidebar-header';
import { SidebarUser } from '../sidebar-user';

import { FlowsNavigation } from './flows-navigation';
import { TablesNavigation } from './tables-navigation';

export function BuilderNavigationSidebar({
  children,
}: {
  children: React.ReactNode;
}) {
  const { embedState } = useEmbedding();

  return (
    <AllowOnlyLoggedInUserOnlyGuard>
      <SidebarProvider>
        {!embedState.isEmbedded && (
          <Sidebar id={BUILDER_NAVIGATION_SIDEBAR_ID} variant="inset">
            <AppSidebarHeader />
            <SidebarContent className="gap-y-0">
              <FlowsNavigation />
              <SidebarSeparator className="my-2" />
              <TablesNavigation />
            </SidebarContent>
            <SidebarFooter>
              <SidebarUser />
            </SidebarFooter>
          </Sidebar>
        )}
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </AllowOnlyLoggedInUserOnlyGuard>
  );
}
