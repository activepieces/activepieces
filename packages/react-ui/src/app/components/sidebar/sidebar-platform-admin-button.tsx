import { t } from 'i18next';
import { LogOut, Shield } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
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
    <SidebarMenuButton
      onClick={() => {
        if (isInPlatformAdmin) {
          navigate('/dashboard');
        } else {
          navigate('/platform');
        }
      }}
      className="relative"
    >
      {isInPlatformAdmin ? <LogOut /> : <Shield />}
      {isInPlatformAdmin ? t('Exit Platform Admin') : t('Enter Platform Admin')}
      {showNotificationDot && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></div>
      )}
    </SidebarMenuButton>
  );
}
