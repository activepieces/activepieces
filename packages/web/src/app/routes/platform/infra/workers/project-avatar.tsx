import {
  PROJECT_COLOR_PALETTE,
  ProjectType,
  ProjectWithLimits,
} from '@activepieces/shared';

import { cn } from '@/lib/utils';

export function ProjectAvatar({ project, size = 'md' }: ProjectAvatarProps) {
  const isPersonal = project.type === ProjectType.PERSONAL;
  const palette = PROJECT_COLOR_PALETTE[project.icon.color];
  const background = isPersonal ? '#9ca3af' : palette.color;
  const color = isPersonal ? '#ffffff' : palette.textColor;

  const sizeClass = size === 'sm' ? 'size-5 text-[10px]' : 'size-7 text-xs';

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-md font-semibold',
        sizeClass,
      )}
      style={{ backgroundColor: background, color }}
    >
      {project.displayName.charAt(0).toUpperCase()}
    </div>
  );
}

type ProjectAvatarProps = {
  project: ProjectWithLimits;
  size?: 'sm' | 'md';
};
