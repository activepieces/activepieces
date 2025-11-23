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
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar-shadcn';
import { InviteUserDialog } from '@/features/members/component/invite-user-dialog';
import { projectMembersHooks } from '@/features/members/lib/project-members-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { ApFlagId, isNil, Permission } from '@activepieces/shared';

import { ApProjectDisplay } from '../ap-project-display';
import { ProjectSettingsDialog } from '../project-settings';

export const ProjectDashboardPageHeader = ({
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
  const { project } = projectHooks.useCurrentProject();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<
    'general' | 'members'
  >('general');
  const { embedState } = useEmbedding();
  const location = useLocation();
  const { projectMembers } = projectMembersHooks.useProjectMembers();
  const { checkAccess } = useAuthorization();
  const userHasPermissionToReadProjectMembers = checkAccess(
    Permission.READ_PROJECT_MEMBER,
  );

  const { data: showProjectMembersFlag } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_PROJECT_MEMBERS,
  );

  const isEmbedded = embedState.isEmbedded;

  const userHasPermissionToInviteUser = checkAccess(
    Permission.WRITE_INVITATION,
  );

  const showProjectMembersIcons =
    !isEmbedded &&
    showProjectMembersFlag &&
    userHasPermissionToReadProjectMembers &&
    !isNil(projectMembers);

  const showInviteUserButton = !isEmbedded && userHasPermissionToInviteUser;
  const showSettingsButton = !isEmbedded;
  const isProjectPage = location.pathname.includes('/projects/');

  if (embedState.hidePageHeader) {
    return null;
  }
  return (
    <div className="flex items-center justify-between min-w-full py-3">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-5 mr-2" />
          <div>
            <div className="flex items-center gap-2">
              <ApProjectDisplay
                title={title}
                maxLengthToNotShowTooltip={30}
                titleClassName="text-lg font-semibold"
              />
              {beta && (
                <div className="flex items-center">
                  <BetaBadge />
                </div>
              )}
            </div>
            {description && (
              <span className="text-xs text-muted-foreground">
                {description}
              </span>
            )}
          </div>
        </div>
        {isProjectPage && (
          <div className="flex items-center gap-3">
            {showProjectMembersIcons && (
              <div className="flex items-center gap-2 px-3 py-1.5 ">
                <UsersRound className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {projectMembers?.length}
                </span>
              </div>
            )}
            {showInviteUserButton && (
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
            {showSettingsButton && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shadow-sm px-2"
                  >
                    <DotsHorizontalIcon className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-semibold">
                    <ApProjectDisplay
                      title={project.displayName}
                      maxLengthToNotShowTooltip={23}
                      titleClassName="font-semibold"
                    />
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {showInviteUserButton && (
                    <DropdownMenuItem onClick={() => setInviteOpen(true)}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Invite
                    </DropdownMenuItem>
                  )}
                  {showProjectMembersIcons && (
                    <DropdownMenuItem
                      onClick={() => {
                        setSettingsInitialTab('members');
                        setSettingsOpen(true);
                      }}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Members
                    </DropdownMenuItem>
                  )}
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
            )}
          </div>
        )}
      </div>
      {children}
      <InviteUserDialog open={inviteOpen} setOpen={setInviteOpen} />
      <ProjectSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        initialTab={settingsInitialTab}
        initialValues={{
          projectName: project?.displayName,
          aiCredits: project?.plan?.aiCredits?.toString() ?? '',
        }}
      />
    </div>
  );
};
