import { User } from 'lucide-react';

import { Avatar } from '@/components/ui/avatar';
import { SidebarMenuButton, useSidebar } from '@/components/ui/sidebar-shadcn';
import { getProjectName } from '@/hooks/project-collection';
import { cn } from '@/lib/utils';
import {
  isNil,
  PROJECT_COLOR_PALETTE,
  ProjectType,
  ProjectWithLimits,
} from '@activepieces/shared';

const MAX_LENGTH_TO_NOT_SHOW_TOOLTIP = 28;

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

  const projectName = getProjectName(project);

  const projectAvatar = isNil(project.icon) ? null : project.type ===
    ProjectType.TEAM ? (
    <Avatar
      className="size-4 scale-125 text-sm font-bold flex items-center justify-center rounded-[4px]"
      style={{
        backgroundColor: PROJECT_COLOR_PALETTE[project.icon.color].color,
        color: PROJECT_COLOR_PALETTE[project.icon.color].textColor,
      }}
    >
      <span className="scale-75">{projectName.charAt(0).toUpperCase()}</span>
    </Avatar>
  ) : (
    <User className="size-4 " />
  );

  const shouldShowTooltip = projectName.length > MAX_LENGTH_TO_NOT_SHOW_TOOLTIP;
  const displayText = shouldShowTooltip
    ? `${projectName.substring(0, MAX_LENGTH_TO_NOT_SHOW_TOOLTIP)}...`
    : projectName;
  const isCollapsed = state === 'collapsed';
  return (
    <SidebarMenuButton
      onClick={() => handleProjectSelect(project.id)}
      className={cn('', {
        'bg-sidebar-accent! ': isCurrentProject,
      })}
    >
      {projectAvatar}
      {!isCollapsed && <span className={cn('truncate')}>{displayText}</span>}
    </SidebarMenuButton>
  );
};

export default ProjectSideBarItem;
