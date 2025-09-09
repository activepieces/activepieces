import { useEmbedding } from '@/components/embed-provider';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from '@/components/ui/sidebar-shadcn';

import { FoldersSection } from './sidebar-folders';
import { AppSidebarHeader } from './sidebar-header';
import { TablesSection } from './sidebar-tables';
import { SidebarUser } from './sidebar-user';

export function BuilderNavigationSidebar() {
  const { embedState } = useEmbedding();

  return (
    !embedState.isEmbedded && (
      <Sidebar variant="inset">
        <AppSidebarHeader />
        <SidebarContent className="gap-y-0">
          <FoldersSection />
          <TablesSection />
        </SidebarContent>
        <SidebarFooter>
          <SidebarUser />
        </SidebarFooter>
      </Sidebar>
    )
  );
}
