import {
  PROJECT_COLOR_PALETTE,
  ProjectType,
  ProjectWithLimits,
} from '@activepieces/shared';

import { cn } from '@/lib/utils';

export function ProjectAvatar({ project, size = 'md' }: ProjectAvatarProps) {
  const isPersonal = project.type === ProjectType.PERSONAL;
  const palette = PROJECT_COLOR_PALETTE[project.icon.color];

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-md font-medium',
        size === 'sm' ? 'size-5 text-xs' : 'size-7 text-sm',
        isPersonal && 'bg-gray-11 text-gray-1',
      )}
      style={
        isPersonal
          ? undefined
          : { backgroundColor: palette.color, color: palette.textColor }
      }
    >
      <span className="leading-none">
        {project.displayName.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

type ProjectAvatarProps = {
  project: Pick<ProjectWithLimits, 'type' | 'icon' | 'displayName'>;
  size?: 'sm' | 'md';
};
