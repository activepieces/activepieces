import { isNil } from '@activepieces/core-utils';
import {
  PROJECT_COLOR_PALETTE,
  ProjectType,
  ProjectWithLimits,
} from '@activepieces/shared';
import { User } from 'lucide-react';

import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

import { getProjectName } from '../stores/project-collection';

export function ProjectLetterAvatar({
  project,
  className,
}: {
  project: ProjectWithLimits;
  className?: string;
}) {
  if (project.type !== ProjectType.TEAM || isNil(project.icon)) {
    return <User className={cn('size-4 shrink-0', className)} />;
  }
  const palette = PROJECT_COLOR_PALETTE[project.icon.color];
  const projectName = getProjectName(project);
  return (
    <Avatar
      className={cn(
        'size-[18px] shrink-0 flex items-center justify-center rounded-[4px] text-sm font-bold',
        className,
      )}
      style={{
        backgroundColor: palette.color,
        color: palette.textColor,
      }}
    >
      <span className="scale-75">{projectName.charAt(0).toUpperCase()}</span>
    </Avatar>
  );
}
