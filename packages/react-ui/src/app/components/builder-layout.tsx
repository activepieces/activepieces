import React from 'react';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar-shadcn';

import { AllowOnlyLoggedInUserOnlyGuard } from './allow-logged-in-user-only-guard';
import { BuilderNavigationSidebar } from './sidebar/builder-sidebar';

export function BuilderLayout({ children }: { children: React.ReactNode }) {
  return (
    <AllowOnlyLoggedInUserOnlyGuard>
      <SidebarProvider>
        <BuilderNavigationSidebar />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </AllowOnlyLoggedInUserOnlyGuard>
  );
}
