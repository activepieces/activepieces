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
import { cn } from '@/lib/utils';
import { PROJECT_COLOR_PALETTE, ProjectWithLimits } from '@activepieces/shared';

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

  const projectAvatar = (
    <Avatar
      className="size-6 flex items-center justify-center rounded-sm"
      style={{
        backgroundColor: PROJECT_COLOR_PALETTE[project.icon.color].color,
        color: PROJECT_COLOR_PALETTE[project.icon.color].textColor,
      }}
    >
      {project.displayName.charAt(0).toUpperCase()}
    </Avatar>
  );

  return (
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
            'px-2 py-5 cursor-pointer',
            isCurrentProject && 'bg-sidebar-active hover:!bg-sidebar-active',
          )}
        >
          <div onClick={() => handleProjectSelect(project.id)}>
            <ApProjectDisplay
              title={project.displayName}
              icon={project.icon}
              maxLengthToNotShowTooltip={28}
            />
          </div>
        </SidebarMenuButton>
      )}
    </SidebarMenuItem>
  );
};

export default ProjectSideBarItem;
