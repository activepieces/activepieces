import { t } from 'i18next';
import { LogOut, Shield } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import { useEmbedding } from '@/components/embed-provider';
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar-shadcn';
import { useShowPlatformAdminDashboard } from '@/hooks/authorization-hooks';
import { notificationHooks } from '@/hooks/notifications-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { PlatformRole } from '@activepieces/shared';

export function SidebarPlatformAdminButton() {
  const showPlatformAdminDashboard = useShowPlatformAdminDashboard();
  const { embedState } = useEmbedding();
  const location = useLocation();
  const isInPlatformAdmin = location.pathname.startsWith('/platform');
  const messages = notificationHooks.useNotifications();
  const platformRole = userHooks.getCurrentUserPlatformRole();
  const showNotificationDot =
    messages.length > 0 &&
    !isInPlatformAdmin &&
    platformRole === PlatformRole.ADMIN;
  if (embedState.isEmbedded || !showPlatformAdminDashboard) {
    return null;
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        to={isInPlatformAdmin ? '/home' : '/platform'}
        label={
          isInPlatformAdmin
            ? t('Exit Platform Admin')
            : t('Enter Platform Admin')
        }
        Icon={isInPlatformAdmin ? <LogOut /> : <Shield />}
        isSubItem={false}
        showNotificationDot={showNotificationDot}
      />
    </SidebarMenuItem>
  );
}
