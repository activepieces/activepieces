import { UserPlus, UsersRound, Settings, Lock } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useEmbedding } from '@/components/embed-provider';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar-shadcn';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { InviteUserDialog } from '@/features/members/component/invite-user-dialog';
import { projectMembersHooks } from '@/features/members/lib/project-members-hooks';
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
  const { platform } = platformHooks.useCurrentPlatform();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
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
                title={
                  project.type === ProjectType.PERSONAL
                    ? 'Personal Project'
                    : title
                }
                maxLengthToNotShowTooltip={30}
                titleClassName="text-base"
                projectType={project.type}
              />
              {project.type === ProjectType.PERSONAL && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Lock className="w-4 h-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>This is your private project. Only you can see and access it.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setSettingsInitialTab(getFirstAvailableTab());
                  setSettingsOpen(true);
                }}
              >
                <Settings className="w-4 h-4" />
              </Button>
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
        }}
      />
    </div>
  );
};
