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
import { ProjectWithLimits } from '@activepieces/shared';

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
  const isCollapsed = state === 'collapsed';

  return (
    <SidebarMenuItem onClick={(e) => e.stopPropagation()}>
      {isCollapsed ? (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={'ghost'}
                size={'icon'}
                onClick={() => handleProjectSelect(project.id)}
                className={cn(
                  isCurrentProject &&
                    'bg-sidebar-active hover:!bg-sidebar-active',
                  'relative flex items-center justify-center',
                )}
              >
                <Avatar className="size-6 bg-primary flex items-center justify-center rounded-sm text-primary-foreground">
                  {project.displayName.charAt(0).toUpperCase()}
                </Avatar>
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
          <div
            onClick={() => handleProjectSelect(project.id)}
            className="flex items-center gap-2"
          >
            <Avatar className="size-6 bg-primary flex items-center justify-center rounded-sm text-primary-foreground">
              {project.displayName.charAt(0).toUpperCase()}
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
