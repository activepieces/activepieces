import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar-shadcn';
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

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        className={cn(
          'px-2 py-5 cursor-pointer',
          isCurrentProject && 'bg-neutral-200 hover:!bg-neutral-200',
        )}
        onClick={() => {
          setCurrentProject(queryClient, project, location.pathname);
        }}
      >
        <div className="flex items-center gap-2">
          <Avatar className="size-5 bg-primary text-primary-foreground rounded-lg">
            <AvatarFallback>{project.displayName.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="truncate text-ellipsis max-w-[250px]">
            {project.displayName}
          </span>
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

export default ProjectSideBarItem;
