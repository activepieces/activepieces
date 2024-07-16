import { Bug, Link2, Logs, Plus, Settings, Zap, Shield } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { issueHooks } from '@/features/issues/hooks/issue-hooks';
import { ProjectSwitcher } from '@/features/projects/components/project-switcher';
import { theme } from '@/lib/theme';

import { Button } from '../ui/button';

import { UserSettingsDropdown } from './user-settings-dropdown';

type Link = {
  icon: React.ReactNode;
  label: string;
  to: string;
  notifcation?: boolean;
};

const CustomTooltipLink = ({
  to,
  label,
  Icon,
  extraClasses,
  notifcation,
}: {
  to: string;
  label: string;
  Icon: React.ElementType;
  extraClasses?: string;
  notifcation?: boolean;
}) => {
  const location = useLocation();
  const isActive = location.pathname.startsWith(to);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to={to}
          className={`relative flex flex-col items-center justify-center gap-4 rounded-lg p-1  transition-colors hover:text-primary md:size-8 ${
            isActive ? 'bg-accent text-primary' : ''
          } ${extraClasses || ''}`}
        >
          <Icon className="size-6" />
          <span className="sr-only">{label}</span>
          {notifcation && (
            <span className="absolute right-[-3px] top-[-3px] size-2 rounded-full bg-destructive"></span>
          )}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
};

export function Sidebar({ children }: { children: React.ReactNode }) {
  const { data: showIssuesNotification } = issueHooks.useIssuesNotification();

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <aside className="w-18 flex flex-col border-r bg-background">
        <nav className="flex flex-col items-center gap-5  px-2 sm:py-5">
          <div className="h-[48px] items-center justify-center p-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <img src={theme.logoIconUrl} alt="logo" />
              </TooltipTrigger>
              <TooltipContent side="right">{theme.websiteName}</TooltipContent>
            </Tooltip>
          </div>
          <CustomTooltipLink to="/flows" label="Flows" Icon={Zap} />
          <CustomTooltipLink to="/runs" label="Runs" Icon={Logs} />
          <CustomTooltipLink
            to="/issues"
            label="Issues"
            Icon={Bug}
            notifcation={showIssuesNotification}
          />
          <CustomTooltipLink to="/connections" label="Link" Icon={Link2} />

          <CustomTooltipLink to="/settings" label="Settings" Icon={Settings} />
        </nav>
      </aside>
      <div className="flex-1 p-4">
        <div className="g2 flex flex-col">
          <div className="flex ">
            <ProjectSwitcher />
            <div className="grow"></div>
            <div className="flex items-center justify-center gap-4">
              <Button
                variant={'outline'}
                size="sm"
                className="flex items-center justify-center gap-2"
              >
                <Plus className="size-4" />
                <span>Invite User</span>
              </Button>
              <Button
                variant={'outline'}
                size="sm"
                className="flex items-center justify-center gap-2"
              >
                <Shield className="size-4" />
                <span>Platform Admin</span>
              </Button>
              <UserSettingsDropdown />
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
