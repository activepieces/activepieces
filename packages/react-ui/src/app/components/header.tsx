import { Shield, X } from 'lucide-react';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

import { ProgressCircularComponent } from '@/components/custom/circular-progress';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { ProjectSwitcher } from '@/features/projects/components/project-switcher';
import { InviteUserDialog } from '@/features/team/component/invite-user-dialog';
import { projectHooks } from '@/hooks/project-hooks';
import { formatUtils } from '@/lib/utils';
import { ApFlagId, isNil } from '@activepieces/shared';

import { FlagGuard } from './flag-guard';

export const Header = () => {
  const history = useLocation();
  const isInPlatformAdmin = history.pathname.startsWith('/platform');

  return (
    <div className="flex ">
      {isInPlatformAdmin ? <span className="text-2xl px-4 py-2">
        Platform Admin
      </span> : <ProjectSwitcher />}
      <div className="grow"></div>
      <div className="flex items-center justify-center gap-4">
        <InviteUserDialog></InviteUserDialog>
        <Link to={isInPlatformAdmin ? '/' : '/platform'}>
          <Button
            variant={'outline'}
            size="sm"
            className="flex items-center justify-center gap-2"
          >
            {isInPlatformAdmin ? <X className="size-4" /> : <Shield className="size-4" />}
            <span>
              {isInPlatformAdmin ? 'Exit Platform Admin' : 'Platform Admin'}
            </span>
          </Button>
        </Link>
        <TaskLimitButton />
        <UserAvatar />
      </div>
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
            Tasks Per Month
          </span>
        </Button>
      </Link>
    </FlagGuard>
  );
});
TaskLimitButton.displayName = 'TaskLimitButton';
