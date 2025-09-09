import { t } from 'i18next';
import { Bell, GitBranch, Puzzle, Settings, Users } from 'lucide-react';
import { useState } from 'react';
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
import { EditProjectDialog } from '@/features/projects/components/edit-project-dialog';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';
import { Permission, isNil } from '@activepieces/shared';

import { AppearanceSettings } from './appearance-settings';

export type ProjectSettingsLinkItem = {
  title: string;
  href: string;
  icon: JSX.Element;
  hasPermission?: boolean;
  onClick?: () => void;
};

const ProjectSettingsDropdownMenu = () => {
  const location = useLocation();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { project } = projectHooks.useCurrentProject();

  const { checkAccess } = useAuthorization();
  const linkActive = (item: ProjectSettingsLinkItem) =>
    location.pathname.startsWith(item.href);

  const linkItems: ProjectSettingsLinkItem[] = [
    {
      title: t('General'),
      href: authenticationSession.appendProjectRoutePrefix('/settings/general'),
      icon: <Settings className="w-4 h-4" />,
      onClick: () => {
        setEditDialogOpen(true);
      },
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
      title: t('Environments'),
      href: authenticationSession.appendProjectRoutePrefix(
        '/settings/environments',
      ),
      icon: <GitBranch className="w-4 h-4" />,
      hasPermission: checkAccess(Permission.READ_PROJECT_RELEASE),
    },
  ];

  const filterOnPermission = (item: ProjectSettingsLinkItem) =>
    isNil(item.hasPermission) || item.hasPermission;

  const filteredLinkItems = linkItems.filter(filterOnPermission);

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
            <TooltipContent side="bottom">
              {t('Project Settings')}
            </TooltipContent>
          </Tooltip>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[180px] space-y-2">
          <AppearanceSettings />
          {filteredLinkItems.map((item) => (
            <DropdownMenuItem key={item.title} className="p-0">
              {item.onClick ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn('gap-x-2 w-full justify-start', {
                    'bg-accent text-primary': linkActive(item),
                  })}
                  onClick={item.onClick}
                >
                  {item.icon}
                  {item.title}
                </Button>
              ) : (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                    'gap-x-2 w-full justify-start',
                    {
                      'bg-accent text-primary': linkActive(item),
                    },
                  )}
                >
                  {item.icon}
                  {item.title}
                </Link>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <EditProjectDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        projectId={project?.id}
        initialValues={{
          projectName: project?.displayName,
          tasks: project?.plan?.tasks?.toString() ?? '',
          aiCredits: project?.plan?.aiCredits?.toString() ?? '',
        }}
      />
    </>
  );
};

export default ProjectSettingsDropdownMenu;
