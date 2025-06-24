import { t } from 'i18next';
import { Bell, GitBranch, Puzzle, Settings, Users } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';
import { Permission, isNil } from '@activepieces/shared';

import { AppearanceSettings } from './appearance-settings';
import { EditProjectDialog } from '../routes/settings/edit-project-dialog';
import { useState } from 'react';

export type ProjectSettingsLinkItem = {
  title: string;
  href: string;
  icon: JSX.Element;
  hasPermission?: boolean;
  onClick?: () => void;
};
const ProjectSettingsDropdownMenu = () => {
  const location = useLocation();
  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false);

  const { platform } = platformHooks.useCurrentPlatform();
  const { checkAccess } = useAuthorization();
  const linkActive = (item: ProjectSettingsLinkItem) =>
    location.pathname.startsWith(item.href);

  const linkItems: ProjectSettingsLinkItem[] = [
    {
      title: t('General'),
      href: '#',
      icon: <Settings className="w-4 h-4" />,
      onClick: () => setIsEditProjectDialogOpen(true),
    },

    {
      title: t('Team'),
      href: authenticationSession.appendProjectRoutePrefix('/settings/team'),
      icon: <Users className="h-4 w-4" />,
      hasPermission: checkAccess(Permission.READ_PROJECT_MEMBER),
    },
    {
      title: t('Pieces'),
      href: authenticationSession.appendProjectRoutePrefix('/settings/pieces'),
      icon: <Puzzle className="h-4 w-4" />,
    },
    {
      title: t('Alerts'),
      href: authenticationSession.appendProjectRoutePrefix('/settings/alerts'),
      icon: <Bell className="h-4 w-4" />,
      hasPermission: checkAccess(Permission.READ_ALERT),
    },
    {
      title: t('Environments'),
      href: authenticationSession.appendProjectRoutePrefix(
        '/settings/environments',
      ),
      icon: <GitBranch className="w-4 h-4" />,
      hasPermission: checkAccess(Permission.READ_PROJECT_RELEASE),
    },
  ];

  const filterAlerts = (item: ProjectSettingsLinkItem) =>
    platform.plan.alertsEnabled || item.title !== t('Alerts');

  const filterOnPermission = (item: ProjectSettingsLinkItem) =>
    isNil(item.hasPermission) || item.hasPermission;

  const filteredLinkItems = linkItems
    .filter(filterAlerts)
    .filter(filterOnPermission);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t('Project Settings')}</TooltipContent>
          </Tooltip>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[180px] space-y-2">
          <AppearanceSettings />
          {filteredLinkItems.map((item) => (
            <DropdownMenuItem key={item.title} className="p-0">
              <Link
                key={item.href}
                to={item.href}
                onClick={item.onClick}
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  'gap-x-2 w-full justify-start',
                  {
                    'bg-secondary text-primary': linkActive(item),
                  }
                )}
              >
                {item.icon}
                {item.title}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <EditProjectDialog
        open={isEditProjectDialogOpen}
        onOpenChange={setIsEditProjectDialogOpen}
      />
    </>
  );
};

export default ProjectSettingsDropdownMenu;
