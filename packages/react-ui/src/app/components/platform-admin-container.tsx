import { t } from 'i18next';
import {
  ArrowLeft,
  LayoutGrid,
  LineChart,
  Server,
  Shield,
  Users,
  Wrench,
} from 'lucide-react';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';

import { UpgradeDialog } from '@/features/billing/components/upgrade-dialog';
import { useShowPlatformAdminDashboard } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { ApEdition, ApFlagId } from '@activepieces/shared';

import { AllowOnlyLoggedInUserOnlyGuard } from './allow-logged-in-user-only-guard';
import { SidebarComponent } from './sidebar';
import { PlatformAdminSidebar } from './sidebar/sidebar-platform-admin';

type PlatformAdminContainerProps = {
  children: React.ReactNode;
};

export function PlatformAdminContainer({
  children,
}: PlatformAdminContainerProps) {

  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const showPlatformAdminDashboard = useShowPlatformAdminDashboard();



  return (
    <AllowOnlyLoggedInUserOnlyGuard>
      {showPlatformAdminDashboard ? (
        <SidebarComponent sidebar={<PlatformAdminSidebar />}>{children}</SidebarComponent>
      ) : (
        <Navigate to="/" />
      )}
      {edition === ApEdition.CLOUD && <UpgradeDialog />}
    </AllowOnlyLoggedInUserOnlyGuard>
  );
}
