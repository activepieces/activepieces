import { t } from 'i18next';
import { LogOut, Shield } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar-shadcn';
import { useShowPlatformAdminDashboard } from '@/hooks/authorization-hooks';
import { useEmbedding } from '@/components/embed-provider';
import { notificationHooks } from '../routes/platform/notifications/hooks/notifictions-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { PlatformRole } from '@activepieces/shared';

export function SidebarPlatformAdminButton() {
  const showPlatformAdminDashboard = useShowPlatformAdminDashboard();
  const { embedState } = useEmbedding();
  const location = useLocation();
  const isInPlatformAdmin = location.pathname.startsWith('/platform');
  const messages = notificationHooks.useNotifications();
  const platformRole = userHooks.getCurrentUserPlatformRole();

  if (embedState.isEmbedded || !showPlatformAdminDashboard) {
    return null;
  }

  return (
    <SidebarMenuItem className="hover:bg-accent hover:text-primary rounded-lg transition-colors">
      <SidebarMenuButton
        asChild
        isActive={isInPlatformAdmin}
      >
        <Link
          to={isInPlatformAdmin ? '/' : '/platform'}
          className="flex items-center gap-2 relative"
        >
          {isInPlatformAdmin ? (
            <>
              <LogOut className="!size-5" />
              <span>{t('Exit Platform Admin')}</span>
            </>
          ) : (
            <>
              <Shield className="!size-5" />
              <span>{t('Enter Platform Admin')}</span>
            </>
          )}
          {messages.length > 0 &&
            !isInPlatformAdmin &&
            platformRole === PlatformRole.ADMIN && (
              <span className="bg-destructive absolute right-0 top-1/2 transform -translate-y-1/2 size-2 rounded-full"></span>
            )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}