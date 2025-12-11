import { Settings, User } from 'lucide-react';
import { useState } from 'react';

import {
  PlatformRole,
  PROJECT_COLOR_PALETTE,
  ProjectType,
  ProjectWithLimits,
} from '@activepieces/shared';

import { ApProjectDisplay } from '../../ap-project-display';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar-shadcn';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { cn } from '@/lib/utils';
import { ProjectSettingsDialog } from '../../project-settings';
import { PERSONAL_PROJECT_NAME } from '@/hooks/project-hooks';

type ProjectSideBarItemProps = {
  project: ProjectWithLimits;
  isCurrentProject: boolean;
  handleProjectSelect: (projectId: string) => void;
};

const ProjectSideBarItem = ({
  project,
  isCurrentProject,
  handleProjectSelect,
}: ProjectSideBarItemProps) => {
  const { state } = useSidebar();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<
    'general' | 'members' | 'alerts' | 'pieces' | 'environment'
  >('general');
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: user } = userHooks.useCurrentUser();

  const getFirstAvailableTab = ():
    | 'general'
    | 'members'
    | 'alerts'
    | 'pieces'
    | 'environment' => {
    const hasGeneralSettings =
      project.type === ProjectType.TEAM ||
      (platform.plan.embeddingEnabled && user?.platformRole === PlatformRole.ADMIN);

    if (hasGeneralSettings) return 'general';
    return 'pieces';
  };

  const showSettings = !platform.plan.embeddingEnabled

  const projectAvatar =
    project.type === ProjectType.TEAM ? (
      <Avatar
        className="size-6 flex items-center justify-center rounded-sm"
        style={{
          backgroundColor: PROJECT_COLOR_PALETTE[project.icon.color].color,
          color: PROJECT_COLOR_PALETTE[project.icon.color].textColor,
        }}
      >
        {project.displayName.charAt(0).toUpperCase()}
      </Avatar>
    ) : (
      <User className="size-5 flex items-center justify-center" />
    );

  return (
    <>
      <SidebarMenuItem onClick={(e) => e.stopPropagation()}>
        {state === 'collapsed' ? (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleProjectSelect(project.id)}
                  className={cn(
                    isCurrentProject &&
                    'bg-sidebar-active hover:!bg-sidebar-active',
                    'relative flex items-center justify-center',
                  )}
                >
                  {projectAvatar}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" align="center">
                {project.displayName}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <SidebarMenuButton
            asChild
            className={cn(
              'px-2 py-5 cursor-pointer group/project',
              isCurrentProject && 'bg-sidebar-active hover:!bg-sidebar-active',
            )}
          >
            <div className="w-full flex items-center justify-between gap-2">
              <div
                onClick={() => handleProjectSelect(project.id)}
                className="flex-1 flex items-center gap-2 min-w-0"
              >
                <ApProjectDisplay
                  title={
                    project.type === ProjectType.PERSONAL
                      ? PERSONAL_PROJECT_NAME
                      : project.displayName
                  }
                  icon={project.icon}
                  maxLengthToNotShowTooltip={28}
                  projectType={project.type}
                />
              </div>
              <div className="flex items-center gap-1">
                {showSettings && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover/project:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSettingsInitialTab(getFirstAvailableTab());
                      setSettingsOpen(true);
                    }}
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </SidebarMenuButton>
        )}
      </SidebarMenuItem>
      <ProjectSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        initialTab={settingsInitialTab}
        initialValues={{
          projectName: project?.displayName,
        }}
      />
    </>
  );
};

export default ProjectSideBarItem;
