import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { UserPlus, UsersRound, Users, Settings } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { BetaBadge } from '@/components/custom/beta-badge';
import { useEmbedding } from '@/components/embed-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { InviteUserDialog } from '@/features/team/component/invite-user-dialog';
import { projectMembersHooks } from '@/features/team/lib/project-members-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { Permission } from '@activepieces/shared';

import { ProjectSettingsDialog } from './project-settings';

export const DashboardPageHeader = ({
  title,
  children,
  description,
  beta = false,
}: {
  title: string;
  children?: React.ReactNode;
  description?: React.ReactNode;
  beta?: boolean;
}) => {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<
    'general' | 'team'
  >('general');
  const { embedState } = useEmbedding();
  const location = useLocation();
  const { projectMembers } = projectMembersHooks.useProjectMembers();
  const { project } = projectHooks.useCurrentProject();
  const { checkAccess } = useAuthorization();
  const userHasPermissionToInviteUser = checkAccess(
    Permission.WRITE_INVITATION,
  );
  const isProjectPage = location.pathname.includes('/projects/');

  if (embedState.hidePageHeader) {
    return null;
  }
  return (
    <div className="flex items-center justify-between mb-4 py-2 min-w-full px-4 z-30 -mx-4">
      <div className="flex items-center justify-between w-full">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{title}</h1>
            {beta && (
              <div className="flex items-center">
                <BetaBadge />
              </div>
            )}
          </div>
          {description && (
            <span className="text-xs text-muted-foreground">{description}</span>
          )}
        </div>
        {isProjectPage && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 ">
              <UsersRound className="w-4 h-4" />
              <span className="text-sm font-medium">
                {projectMembers?.length}
              </span>
            </div>
            {userHasPermissionToInviteUser && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 shadow-sm"
                onClick={() => setInviteOpen(true)}
              >
                <UserPlus className="w-4 h-4" />
                <span className="text-sm font-medium">Invite</span>
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="shadow-sm px-2">
                  <DotsHorizontalIcon className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-semibold">
                  {project?.displayName}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userHasPermissionToInviteUser && (
                  <DropdownMenuItem onClick={() => setInviteOpen(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => {
                    setSettingsInitialTab('team');
                    setSettingsOpen(true);
                  }}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Members
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSettingsInitialTab('general');
                    setSettingsOpen(true);
                  }}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      {children}
      <InviteUserDialog open={inviteOpen} setOpen={setInviteOpen} />
      <ProjectSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        projectId={project?.id}
        initialTab={settingsInitialTab}
        initialValues={{
          projectName: project?.displayName,
          aiCredits: project?.plan?.aiCredits?.toString() ?? '',
        }}
      />
    </div>
  );
};
