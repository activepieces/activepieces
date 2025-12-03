import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import {
  UserPlus,
  UsersRound,
  Users,
  Settings,
  PencilIcon,
} from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useEmbedding } from '@/components/embed-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar-shadcn';
import { InviteUserDialog } from '@/features/members/component/invite-user-dialog';
import { projectMembersHooks } from '@/features/members/lib/project-members-hooks';
import { EditProjectDialog } from '@/features/projects/components/edit-project-dialog';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { userHooks } from '@/hooks/user-hooks';
import {
  ApFlagId,
  isNil,
  Permission,
  PlatformRole,
  ProjectType,
} from '@activepieces/shared';

import { ApProjectDisplay } from '../ap-project-display';
import { ProjectAvatar } from '../project-avatar';
import { ProjectSettingsDialog } from '../project-settings';

export const ProjectDashboardPageHeader = ({
  title,
  children,
  description,
}: {
  title: string;
  children?: React.ReactNode;
  description?: React.ReactNode;
}) => {
  const { project } = projectHooks.useCurrentProject();
  const { data: currentUser } = userHooks.useCurrentUser();
  const { platform } = platformHooks.useCurrentPlatform();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [renameProjectOpen, setRenameProjectOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<
    'general' | 'members' | 'alerts' | 'pieces' | 'environment'
  >('general');
  const { embedState } = useEmbedding();
  const location = useLocation();
  const { projectMembers } = projectMembersHooks.useProjectMembers();
  const { checkAccess } = useAuthorization();
  const { data: user } = userHooks.useCurrentUser();
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
    !isNil(projectMembers) &&
    project.type === ProjectType.TEAM;

  const showInviteUserButton =
    !isEmbedded &&
    userHasPermissionToInviteUser &&
    project.type === ProjectType.TEAM;
  const showSettingsButton = !isEmbedded;
  const isProjectPage = location.pathname.includes('/projects/');

  const showRenameProjectButton =
    project.type !== ProjectType.PERSONAL &&
    checkAccess(Permission.WRITE_PROJECT);

  const hasGeneralSettings =
    project.type === ProjectType.TEAM ||
    (platform.plan.embeddingEnabled &&
      user?.platformRole === PlatformRole.ADMIN);

  const getFirstAvailableTab = ():
    | 'general'
    | 'members'
    | 'alerts'
    | 'pieces'
    | 'environment' => {
    if (hasGeneralSettings) return 'general';
    if (
      project.type === ProjectType.TEAM &&
      showProjectMembersFlag &&
      userHasPermissionToReadProjectMembers
    )
      return 'members';
    return 'pieces';
  };

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
                projectType={project.type}
              />
              {project.type === ProjectType.PERSONAL &&
                user?.platformRole === PlatformRole.ADMIN &&
                currentUser?.id === project.ownerId && (
                  <Badge variant={'outline'} className="text-xs font-medium">
                    You
                  </Badge>
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
                <DropdownMenuContent align="end" className="w-60">
                  <div className="mb-2">
                    <ProjectAvatar
                      displayName={project.displayName}
                      projectType={project.type}
                      iconColor={project.icon.color}
                      size="md"
                      showBackground={true}
                      showDetails={true}
                      createdDate={new Date(project.created)}
                    />
                  </div>
                  {showRenameProjectButton && (
                    <DropdownMenuItem
                      onClick={() => setRenameProjectOpen(true)}
                    >
                      <PencilIcon className="w-4 h-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                  )}
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
                      setSettingsInitialTab(getFirstAvailableTab());
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
      <EditProjectDialog
        open={renameProjectOpen}
        onClose={() => setRenameProjectOpen(false)}
        projectId={project.id}
        initialValues={{
          projectName: project?.displayName,
        }}
        renameOnly={true}
      />
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
