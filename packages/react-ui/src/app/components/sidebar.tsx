import { ApFlagId, isNil } from '@activepieces/shared';
import {
  AlertCircle,
  Link2,
  Logs,
  Shield,
  Workflow,
  Wrench,
} from 'lucide-react';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

import { Button, Button } from '../../components/ui/button';
import { UserAvatar, UserAvatar } from '../../components/ui/user-avatar';
import {
  InviteUserDialog,
  InviteUserDialog,
} from '../../features/team/component/invite-user-dialog';

import { FlagGuard, FlagGuard } from './flag-gaurd';

import { ProgressCircularComponent } from '@/components/custom/circular-progress';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { issueHooks } from '@/features/issues/hooks/issue-hooks';
import { ProjectSwitcher } from '@/features/projects/components/project-switcher';
import { projectHooks } from '@/hooks/project-hooks';
import { theme } from '@/lib/theme';
import { formatUtils } from '@/lib/utils';

type Link = {
  icon: React.ReactNode;
  label: string;
  to: string;
  notification?: boolean;
};

const CustomTooltipLink = ({
  to,
  label,
  Icon,
  extraClasses,
  notification,
}: {
  to: string;
  label: string;
  Icon: React.ElementType;
  extraClasses?: string;
  notification?: boolean;
}) => {
  const location = useLocation();

  const isActive = location.pathname.startsWith(to);

  return (
    <Link to={to}>
      <div
        className={`relative flex flex-col items-center justify-center gap-1`}
      >
        <Icon
          className={`size-10 p-2.5 hover:text-primary rounded-lg transition-colors ${
            isActive ? 'bg-accent text-primary' : ''
          } ${extraClasses || ''}`}
        />
        <span className="text-[10px]">{label}</span>
        {notification && (
          <span className="bg-destructive absolute right-[-3px] top-[-3px] size-2 rounded-full"></span>
        )}
      </div>
    </Link>
  );
};

const TaskLimitButton = React.memo(() => {
  const { data: project } = projectHooks.useCurrentProject();

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

export function Sidebar({ children }: { children: React.ReactNode }) {
  const { data: showIssuesNotification } = issueHooks.useIssuesNotification();

  return (
    <div className="flex min-h-screen w-full ">
      <aside className="flex flex-col border-r bg-muted/50">
        <nav className="flex flex-col items-center gap-5 px-1.5 sm:py-5">
          <div className="h-[48px] items-center justify-center p-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <img src={theme.logoIconUrl} alt="logo" className="w-8 h-8" />
              </TooltipTrigger>
              <TooltipContent side="right">{theme.websiteName}</TooltipContent>
            </Tooltip>
          </div>
          <CustomTooltipLink to="/flows" label="Flows" Icon={Workflow} />
          <CustomTooltipLink to="/runs" label="Runs" Icon={Logs} />
          <CustomTooltipLink
            to="/issues"
            label="Issues"
            Icon={AlertCircle}
            notification={showIssuesNotification}
          />
          <CustomTooltipLink
            to="/connections"
            label="Connections"
            Icon={Link2}
          />
          <CustomTooltipLink to="/settings" label="Settings" Icon={Wrench} />
        </nav>
      </aside>
      <div className="flex-1 p-4">
        <div className="flex flex-col">
          <div className="flex ">
            <ProjectSwitcher />
            <div className="grow"></div>
            <div className="flex items-center justify-center gap-4">
              {/* <InviteUserDialog></InviteUserDialog>
              <Button
                variant={'outline'}
                size="sm"
                className="flex items-center justify-center gap-2"
              >
                <Shield className="size-4" />
                <span>Platform Admin</span>
              </Button>
              <TaskLimitButton /> */}
              <UserAvatar />
            </div>
          </div>
          <div className="container mx-auto flex py-10">{children}</div>
        </div>
      </div>
    </div>
  );
}
