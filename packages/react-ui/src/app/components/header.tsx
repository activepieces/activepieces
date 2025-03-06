import { t } from 'i18next';
import { LogOut, Shield } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { PlatformSwitcher } from '@/features/platform-switcher/components/platform-switcher';
import { ProjectSwitcher } from '@/features/projects/components/project-switcher';
import { InviteUserDialog } from '@/features/team/component/invite-user-dialog';
import { useShowPlatformAdminDashboard } from '@/hooks/authorization-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { PlatformRole } from '@activepieces/shared';

import { useEmbedding } from '../../components/embed-provider';
import { Separator } from '../../components/ui/separator';
import { notificationHooks } from '../routes/platform/notifications/hooks/notifictions-hooks';
import { PlatformDialog } from '../routes/platform/notifications/paltform-dialog';

import UsageLimitsButton from './usage-limits-button';
export const Header = () => {
  const history = useLocation();
  const isInPlatformAdmin = history.pathname.startsWith('/platform');
  const showPlatformAdminDashboard = useShowPlatformAdminDashboard();
  const { embedState } = useEmbedding();
  const messages = notificationHooks.useNotifications();
  const platformRole = userHooks.getCurrentUserPlatformRole();

  return (
    !embedState.isEmbedded && (
      <div>
        <PlatformDialog messages={messages} />
        <div className="flex flex-col sm:flex-row items-start sm:items-center pb-2">
          {isInPlatformAdmin ? (
            <span className="text-3xl font-bold px-4 py-2">
              {t('Platform Admin')}
            </span>
          ) : (
            <>
              <PlatformSwitcher />

              <ProjectSwitcher />
            </>
          )}
          <div className="grow"></div>
          <div className="flex items-center justify-center gap-4">
            {/* <InviteUserDialog /> */}
            <UsageLimitsButton />
            {/* {showPlatformAdminDashboard && (
              <Link to={isInPlatformAdmin ? '/' : '/platform'}>
                <Button
                  variant={'outline'}
                  size="sm"
                  className="flex items-center justify-center gap-2 relative"
                >
                   {isInPlatformAdmin ? (
                    <LogOut className="size-4" />
                  ) : (
                    <Shield className="size-4" />
                  )} 
                  <span>
                    {t(
                      isInPlatformAdmin
                        ? 'Exit Platform Admin'
                        : 'Platform Admin',
                    )}
                  </span>
                  {messages.length > 0 &&
                    !isInPlatformAdmin &&
                    platformRole === PlatformRole.ADMIN && (
                      <span className="bg-destructive absolute right-[3px] top-[3px] size-2 rounded-full"></span>
                    )}
                </Button>
              </Link>
            )} */}

            <UserAvatar />
          </div>
        </div>
        <Separator></Separator>
      </div>
    )
  );
};
