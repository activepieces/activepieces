import { t } from 'i18next';
import { LogOut, Shield } from 'lucide-react';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

import { ProgressCircularComponent } from '@/components/custom/circular-progress';
import { Button } from '@/components/ui/button';
import { ReportBugsButton } from '@/components/ui/report-bugs-button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { ProjectSwitcher } from '@/features/projects/components/project-switcher';
import { InviteUserDialog } from '@/features/team/component/invite-user-dialog';
import { useShowPlatformAdminDashboard } from '@/hooks/authorization-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { formatUtils } from '@/lib/utils';
import { ApFlagId, isNil } from '@activepieces/shared';

import { Separator } from '../../components/ui/seperator';

import { FlagGuard } from './flag-guard';

export const Header = () => {
  const history = useLocation();
  const isInPlatformAdmin = history.pathname.startsWith('/platform');
  const showPlatformAdminDashboard = useShowPlatformAdminDashboard();
  return (
    <div>
      <div className="flex h-[60px] items-center">
        {isInPlatformAdmin ? (
          <span className="text-2xl font-bold px-4 py-2">
            {t('Platform Admin')}
          </span>
        ) : (
          <ProjectSwitcher />
        )}
        <div className="grow"></div>
        <div className="flex items-center justify-center gap-4">
          <ReportBugsButton variant="outline"></ReportBugsButton>
          <InviteUserDialog></InviteUserDialog>
          {showPlatformAdminDashboard && (
            <Link to={isInPlatformAdmin ? '/' : '/platform'}>
              <Button
                variant={'outline'}
                size="sm"
                className="flex items-center justify-center gap-2"
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
              </Button>
            </Link>
          )}

          <TaskLimitButton />
          <UserAvatar />
        </div>
      </div>
      <Separator></Separator>
    </div>
  );
};

const TaskLimitButton = React.memo(() => {
  const { project } = projectHooks.useCurrentProject();

  if (isNil(project?.plan?.tasks) || isNil(project?.usage?.tasks)) {
    return null;
  }

  return (
    <FlagGuard flag={ApFlagId.SHOW_BILLING}>
      <Link to={'/plans'}>
        <Button
          variant={'outline'}
          size="sm"
          className="flex items-center justify-center gap-2"
        >
          <ProgressCircularComponent
            size="small"
            data={{
              plan: project.plan.tasks,
              usage: project.usage.tasks,
            }}
          />
          <span>
            <strong>
              {formatUtils.formatNumber(project.usage.tasks)}/
              {formatUtils.formatNumber(project.plan.tasks)}
            </strong>{' '}
            {t('Tasks Per Month')}
          </span>
        </Button>
      </Link>
    </FlagGuard>
  );
});
TaskLimitButton.displayName = 'TaskLimitButton';
