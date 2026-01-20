import { User } from 'lucide-react';

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
import { getProjectName } from '@/hooks/project-collection';
import { cn } from '@/lib/utils';
import {
  PROJECT_COLOR_PALETTE,
  ProjectType,
  ProjectWithLimits,
} from '@activepieces/shared';

import { ApProjectDisplay } from '../../ap-project-display';

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
  const projectAvatar =
    project.type === ProjectType.TEAM ? (
      <Avatar
        className="size-6 flex items-center justify-center rounded-sm cursor-pointer"
        style={{
          backgroundColor: PROJECT_COLOR_PALETTE[project.icon.color].color,
          color: PROJECT_COLOR_PALETTE[project.icon.color].textColor,
        }}
      >
        {project.displayName.charAt(0).toUpperCase()}
      </Avatar>
    ) : (
      <User className="size-5 flex items-center justify-center cursor-pointer" />
    );
  return (
    <SidebarMenuItem>
      {state === 'collapsed' ? (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleProjectSelect(project.id)}
                className={cn('relative flex items-center justify-center', {
                  '!bg-sidebar-accent': isCurrentProject,
                })}
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
          className={cn('px-2 py-5 cursor-pointer group/project', {
            '!bg-sidebar-accent ': isCurrentProject,
          })}
        >
          <div
            onClick={() => handleProjectSelect(project.id)}
            className="w-full flex items-center justify-between gap-2"
          >
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <ApProjectDisplay
                title={getProjectName(project)}
                icon={project.icon}
                maxLengthToNotShowTooltip={28}
                projectType={project.type}
              />
            </div>
          </div>
        </SidebarMenuButton>
      )}
    </SidebarMenuItem>
  );
};

export default ProjectSideBarItem;
