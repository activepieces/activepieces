import React from 'react';
import { Navigate } from 'react-router-dom';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar-shadcn';
import { useShowPlatformAdminDashboard } from '@/hooks/authorization-hooks';

import { AllowOnlyLoggedInUserOnlyGuard } from './allow-logged-in-user-only-guard';
import { PlatformSidebar } from './sidebar/platform';

export function PlatformLayout({ children }: { children: React.ReactNode }) {
  const showPlatformAdminDashboard = useShowPlatformAdminDashboard();

  return (
    <AllowOnlyLoggedInUserOnlyGuard>
      {showPlatformAdminDashboard ? (
        <SidebarProvider>
          <PlatformSidebar />
          <SidebarInset className="px-4 overflow-auto pb-4">
            {children}
          </SidebarInset>
        </SidebarProvider>
      ) : (
        <Navigate to="/" />
      )}
    </AllowOnlyLoggedInUserOnlyGuard>
  );
}
