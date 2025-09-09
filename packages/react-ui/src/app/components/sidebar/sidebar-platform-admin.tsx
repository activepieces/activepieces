import { t } from 'i18next';
import { ArrowLeft, Shield } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { useEmbedding } from '@/components/embed-provider';
import { Dot } from '@/components/ui/dot';
import { useShowPlatformAdminDashboard } from '@/hooks/authorization-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { cn } from '@/lib/utils';
import { PlatformRole } from '@activepieces/shared';

import { notificationHooks } from '../../routes/platform/notifications/hooks/notifications-hooks';

export function SidebarPlatformAdminButton({
  className,
}: {
  className?: string;
}) {
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
    <Link
      to={isInPlatformAdmin ? '/' : '/platform'}
      className={cn(
        'w-full flex items-center justify-center relative',
        className,
      )}
    >
      <div className={`w-full flex items-center gap-2`}>
        {isInPlatformAdmin ? (
          <>
            <ArrowLeft className="size-4" />
            <span className={`text-sm`}>{t('Exit Platform Admin')}</span>
          </>
        ) : (
          <>
            <Shield className="size-4" />
            <span className={`text-sm`}>{t('Platform Admin')}</span>
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
