import { Avatar } from '@/components/ui/avatar';
import {
  ColorName,
  PROJECT_COLOR_PALETTE,
  ProjectType,
} from '@activepieces/shared';

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
  const sizeClasses = {
    sm: {
      container: showDetails ? 'min-h-[140px]' : 'h-[60px]',
      avatar: 'h-[30px] w-[30px]',
      text: 'text-sm',
    },
    md: {
      container: showDetails ? 'min-h-[160px]' : 'h-[114px]',
      avatar: 'h-[50px] w-[50px]',
      text: 'text-xl',
    },
    lg: {
      container: showDetails ? 'min-h-[200px]' : 'h-[150px]',
      avatar: 'h-[70px] w-[70px]',
      text: 'text-3xl',
    },
  };

  const currentSize = sizeClasses[size];

  if (projectType === ProjectType.PERSONAL) {
    return (
      <div
        className={`flex ${
          showDetails ? 'flex-col items-center' : 'items-center'
        } justify-center w-full ${currentSize.container} ${
          showBackground ? 'rounded-tr-md' : ''
        } ${showDetails ? 'py-6' : ''}`}
        style={{
          backgroundColor: showBackground ? '#f3f4f6' : 'transparent',
        }}
      >
        <Avatar
          className={`${
            currentSize.avatar
          } flex items-center justify-center rounded-full ${
            showDetails ? 'mb-3' : ''
          }`}
          style={{
            backgroundColor: '#9ca3af',
            color: '#ffffff',
          }}
        >
          <span className={currentSize.text}>
            {displayName.charAt(0).toUpperCase()}
          </span>
        </Avatar>
        {showDetails && (
          <div className="px-4 text-center">
            <div className="font-semibold text-sm text-black">
              {displayName}
            </div>
            {createdDate && (
              <div className="text-xs text-muted-foreground mt-1">
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
  }

  return (
    <div
      className={`flex ${
        showDetails ? 'flex-col items-center' : 'items-center'
      } justify-center w-full ${currentSize.container} ${
        showBackground ? 'rounded-tr-md' : ''
      } ${showDetails ? 'py-6' : ''}`}
      style={{
        backgroundColor: showBackground
          ? PROJECT_COLOR_PALETTE[iconColor].color + '26'
          : 'transparent',
      }}
    >
      <Avatar
        className={`${
          currentSize.avatar
        } flex items-center justify-center rounded-sm ${
          showDetails ? 'mb-3' : ''
        }`}
        style={{
          backgroundColor: PROJECT_COLOR_PALETTE[iconColor].color,
          color: PROJECT_COLOR_PALETTE[iconColor].textColor,
        }}
      >
        <span className={currentSize.text}>
          {displayName.charAt(0).toUpperCase()}
        </span>
      </Avatar>
      {showDetails && (
        <div className="px-4 text-center">
          <div className="font-semibold text-sm text-black">{displayName}</div>
          {createdDate && (
            <div className="text-xs text-muted-foreground mt-1">
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
