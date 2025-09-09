import { PlatformRole } from '@activepieces/shared';
import { t } from 'i18next';
import { LogOut, Shield } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { notificationHooks } from '../../routes/platform/notifications/hooks/notifications-hooks';

import { Dot } from '@/components/ui/dot';
import { useShowPlatformAdminDashboard } from '@/hooks/authorization-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { cn } from '@/lib/utils';

export function SidebarPlatformAdminButton() {
  const showPlatformAdminDashboard = useShowPlatformAdminDashboard();
  const location = useLocation();
  const isInPlatformAdmin = location.pathname.startsWith('/platform');
  const messages = notificationHooks.useNotifications();
  const platformRole = userHooks.getCurrentUserPlatformRole();

  if (!showPlatformAdminDashboard) {
    return null;
  }

  return (
    <Link
      to={isInPlatformAdmin ? '/' : '/platform'}
      className={cn(
        'w-full relative flex items-center justify-between hover:bg-accent rounded-sm transition-colors',
      )}
    >
      <div className={`w-full flex items-center gap-2 px-2 py-1.5`}>
        {isInPlatformAdmin ? (
          <>
            <LogOut className="size-4" />
            <span className={`text-sm`}>{t('Exit Platform Admin')}</span>
          </>
        ) : (
          <>
            <Shield className="size-4" />
            <span className={`text-sm`}>{t('Enter Platform Admin')}</span>
          </>
        )}
      </div>
      {messages.length > 0 &&
        !isInPlatformAdmin &&
        platformRole === PlatformRole.ADMIN && (
          <Dot
            variant="primary"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 size-2 rounded-full"
          />
        )}
    </Link>
  );
}
