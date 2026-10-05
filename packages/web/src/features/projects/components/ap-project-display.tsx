import { isNil } from '@activepieces/core-utils';
import {
  PROJECT_COLOR_PALETTE,
  ProjectIcon,
  ProjectType,
} from '@activepieces/shared';
import { User } from 'lucide-react';
import { useContext } from 'react';

import { Avatar } from '@/components/ui/avatar';
import { SidebarContext } from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

function useSidebarSafe(): string {
  const context = useContext(SidebarContext);
  return context?.state ?? 'expanded';
}

type ApProjectDisplayProps = {
  title: string;
  icon?: ProjectIcon;
  containerClassName?: string;
  titleClassName?: string;
  iconClassName?: string;
  maxLengthToNotShowTooltip?: number;
  projectType: ProjectType;
  inSidebar?: boolean;
  framePersonalIcon?: boolean;
};

export const ApProjectDisplay = ({
  title,
  icon,
  containerClassName = '',
  titleClassName = '',
  iconClassName,
  maxLengthToNotShowTooltip = 30,
  projectType,
  inSidebar = false,
  framePersonalIcon = false,
}: ApProjectDisplayProps) => {
  const sidebarState = useSidebarSafe();
  const projectAvatar = isNil(icon) ? null : projectType ===
    ProjectType.TEAM ? (
    <Avatar
      className={cn(
        'flex size-6 items-center justify-center rounded-md text-xs font-medium after:hidden',
        iconClassName,
      )}
      style={{
        backgroundColor: PROJECT_COLOR_PALETTE[icon.color].color,
        color: PROJECT_COLOR_PALETTE[icon.color].textColor,
      }}
    >
      {title.charAt(0).toUpperCase()}
    </Avatar>
  ) : framePersonalIcon ? (
    <span
      className={cn(
        'flex size-6 shrink-0 items-center justify-center rounded-md bg-gray-3 text-gray-11',
        iconClassName,
      )}
    >
      <User className="size-4" />
    </span>
  ) : (
    <User className={cn('size-4 shrink-0 text-gray-11', iconClassName)} />
  );

  const shouldShowTooltip = title.length > maxLengthToNotShowTooltip;
  const displayText = shouldShowTooltip
    ? `${title.substring(0, maxLengthToNotShowTooltip)}...`
    : title;

  const content = (
    <div className={cn('flex min-w-0 items-center gap-2', containerClassName)}>
      {projectAvatar}
      {((inSidebar && sidebarState === 'expanded') || !inSidebar) && (
        <span className={cn(titleClassName, 'truncate')}>{displayText}</span>
      )}
    </div>
  );

  if (!shouldShowTooltip) {
    return content;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="bottom" align="start">
          {title}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
