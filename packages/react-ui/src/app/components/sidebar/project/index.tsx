import { useNavigate } from 'react-router-dom';

import { Avatar } from '@/components/ui/avatar';
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
import { authenticationSession } from '@/lib/authentication-session';
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
  const navigate = useNavigate();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const handleClick = () => {
    if (isCurrentProject) {
      return;
    }
    navigate(
      authenticationSession.appendProjectRoutePrefix(`/projects/${project.id}`),
    );
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
                <Avatar className="size-6 bg-primary flex items-center justify-center rounded-sm text-primary-foreground">
                  {project.displayName.charAt(0)}
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
            <Avatar className="size-6 bg-primary flex items-center justify-center rounded-sm text-primary-foreground">
              {project.displayName.charAt(0)}
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
