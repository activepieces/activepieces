import {
  ColorName,
  PROJECT_COLOR_PALETTE,
  ProjectType,
} from '@activepieces/shared';

import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface ProjectAvatarProps {
  displayName: string;
  projectType: ProjectType;
  iconColor: ColorName;
  size?: 'sm' | 'md' | 'lg';
  showBackground?: boolean;
  showDetails?: boolean;
  createdDate?: Date;
}

export const ProjectAvatar = ({
  displayName,
  projectType,
  iconColor,
  size = 'md',
  showBackground = true,
  showDetails = false,
  createdDate,
}: ProjectAvatarProps) => {
  const currentSize = SIZE_CLASSES[size];
  const isPersonal = projectType === ProjectType.PERSONAL;

  return (
    <div
      className={cn(
        'flex w-full items-center justify-center',
        showDetails
          ? cn('flex-col gap-3 py-6', currentSize.detailsContainer)
          : currentSize.container,
        isPersonal && showBackground && 'bg-gray-3',
      )}
      style={
        !isPersonal && showBackground
          ? {
              backgroundColor: `color-mix(in oklab, ${PROJECT_COLOR_PALETTE[iconColor].color}, transparent 85%)`,
            }
          : undefined
      }
    >
      <Avatar
        className={cn(
          'flex items-center justify-center font-medium after:hidden',
          currentSize.avatar,
          isPersonal && 'bg-gray-9 text-gray-1',
        )}
        style={
          isPersonal
            ? undefined
            : {
                backgroundColor: PROJECT_COLOR_PALETTE[iconColor].color,
                color: PROJECT_COLOR_PALETTE[iconColor].textColor,
              }
        }
      >
        <span className={currentSize.text}>
          {displayName.charAt(0).toUpperCase()}
        </span>
      </Avatar>
      {showDetails && (
        <div className="flex flex-col items-center gap-1 px-4">
          <div className="text-sm font-semibold text-gray-12">
            {displayName}
          </div>
          {createdDate && (
            <div className="text-xs text-gray-11">
              Created on{' '}
              {new Intl.DateTimeFormat('en-US', {
                month: 'numeric',
                day: 'numeric',
                year: 'numeric',
              }).format(createdDate)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SIZE_CLASSES = {
  sm: {
    container: 'h-16',
    detailsContainer: 'min-h-36',
    avatar: 'size-8 rounded-lg',
    text: 'text-sm',
  },
  md: {
    container: 'h-28',
    detailsContainer: 'min-h-40',
    avatar: 'size-12 rounded-xl',
    text: 'text-base',
  },
  lg: {
    container: 'h-36',
    detailsContainer: 'min-h-48',
    avatar: 'size-16 rounded-2xl',
    text: 'text-2xl',
  },
} as const;
