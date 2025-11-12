import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { buttonVariants } from '@/components/ui/button';
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
import { projectHooks } from '@/hooks/project-hooks';
import { cn } from '@/lib/utils';
import { ProjectWithLimits } from '@activepieces/shared';

type ProjectSideBarItemProps = {
  project: ProjectWithLimits;
  isCurrentProject: boolean;
};

const ProjectSideBarItem = ({
  project,
  isCurrentProject,
}: ProjectSideBarItemProps) => {
  const { setCurrentProject } = projectHooks.useCurrentProject();
  const queryClient = useQueryClient();
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const handleClick = () => {
    setCurrentProject(queryClient, project, location.pathname);
  };

  return (
    <SidebarMenuItem onClick={(e) => e.stopPropagation()}>
      {isCollapsed ? (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleClick}
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'icon' }),
                  isCurrentProject && 'bg-neutral-200 hover:!bg-neutral-200',
                  'relative cursor-pointer',
                )}
              >
                <Avatar className="size-5 bg-primary text-primary-foreground rounded-lg">
                  <AvatarFallback>
                    {project.displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </button>
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
            isCurrentProject && 'bg-neutral-200 hover:!bg-neutral-200',
          )}
        >
          <div onClick={handleClick} className="flex items-center gap-2">
            <Avatar className="size-5 bg-primary text-primary-foreground rounded-lg">
              <AvatarFallback>{project.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="truncate text-ellipsis max-w-[250px]">
              {project.displayName}
            </span>
          </div>
        </SidebarMenuButton>
      )}
    </SidebarMenuItem>
  );
};

export default ProjectSideBarItem;
