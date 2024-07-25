import { useQueryClient } from '@tanstack/react-query';
import { Bug, Link2, Logs, Settings, Shield, Workflow } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { ProgressCircularComponent } from '@/components/custom/circular-progress';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { issueHooks } from '@/features/issues/hooks/issue-hooks';
import { ProjectSwitcher } from '@/features/projects/components/project-switcher';
import { flagsHooks } from '@/hooks/flags-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { theme } from '@/lib/theme';
import { ApFlagId } from '@activepieces/shared';

import { Button } from '../../components/ui/button';
import { UserAvatar } from '../../components/ui/user-avatar';
import { InviteUserDialog } from '../../features/team/component/invite-user-dialog';

import { RequestTrial } from './request-trial';

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
          className={`size-10 p-2 hover:text-primary rounded-lg transition-colors ${
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

export function Sidebar({ children }: { children: React.ReactNode }) {
  const { data: showIssuesNotification } = issueHooks.useIssuesNotification();
  const { data: project } = projectHooks.useCurrentProject();
  const queryClient = useQueryClient();
  const billingEnabled = flagsHooks.useFlag<boolean>(
    ApFlagId.BILLING_ENABLED,
    queryClient,
  );

  return (
    <div className="flex min-h-screen w-full ">
      <aside className="flex flex-col border-r bg-muted/50">
        <nav className="flex flex-col items-center gap-5 px-1.5 sm:py-5">
          <div className="h-[48px] items-center justify-center p-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <img src={theme.logoIconUrl} alt="logo" />
              </TooltipTrigger>
              <TooltipContent side="right">{theme.websiteName}</TooltipContent>
            </Tooltip>
          </div>
          <CustomTooltipLink to="/flows" label="Flows" Icon={Workflow} />
          <CustomTooltipLink to="/runs" label="Runs" Icon={Logs} />
          <CustomTooltipLink
            to="/issues"
            label="Issues"
            Icon={Bug}
            notification={showIssuesNotification}
          />
          <CustomTooltipLink
            to="/connections"
            label="Connnections"
            Icon={Link2}
          />
          <CustomTooltipLink to="/settings" label="Settings" Icon={Settings} />
        </nav>
      </aside>
      <div className="flex-1 p-4">
        <div className="flex flex-col">
          <div className="flex ">
            <ProjectSwitcher />
            <div className="grow"></div>
            <div className="flex items-center justify-center gap-4">
              <InviteUserDialog></InviteUserDialog>
              <Button
                variant={'outline'}
                size="sm"
                className="flex items-center justify-center gap-2"
              >
                <Shield className="size-4" />
                <span>Platform Admin</span>
              </Button>
              <RequestTrial></RequestTrial>
              {billingEnabled && (
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
                        {project.usage.tasks}/{project.plan.tasks}
                      </strong>{' '}
                      Tasks Per Month
                    </span>
                  </Button>
                </Link>
              )}
              <UserAvatar />
            </div>
          </div>
          <div className="container mx-auto flex py-10">{children}</div>
        </div>
      </div>
    </div>
  );
}
