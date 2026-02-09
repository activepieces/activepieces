import { User } from 'lucide-react';

import { Avatar } from '@/components/ui/avatar';
import { useSidebar } from '@/components/ui/sidebar-shadcn';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  isNil,
  PROJECT_COLOR_PALETTE,
  ProjectIcon,
  ProjectType,
} from '@activepieces/shared';

type ApProjectDisplayProps = {
  title: string;
  icon?: ProjectIcon;
  containerClassName?: string;
  titleClassName?: string;
  maxLengthToNotShowTooltip?: number;
  projectType: ProjectType;
  inSidebar?: boolean;
};

export const ApProjectDisplay = ({
  title,
  icon,
  containerClassName = '',
  titleClassName = '',
  maxLengthToNotShowTooltip = 30,
  projectType,
  inSidebar = false,
}: ApProjectDisplayProps) => {
  const { state } = useSidebar();
  const projectAvatar = isNil(icon) ? null : projectType ===
    ProjectType.TEAM ? (
    <Avatar
      className="size-6 flex items-center justify-center rounded-sm"
      style={{
        backgroundColor: PROJECT_COLOR_PALETTE[icon.color].color,
        color: PROJECT_COLOR_PALETTE[icon.color].textColor,
      }}
    >
      {title.charAt(0).toUpperCase()}
    </Avatar>
  ) : (
    <User className="size-5 flex items-center justify-center" />
  );

  const shouldShowTooltip = title.length > maxLengthToNotShowTooltip;
  const displayText = shouldShowTooltip
    ? `${title.substring(0, maxLengthToNotShowTooltip)}...`
    : title;

  const content = (
    <div className={`flex items-center gap-2 ${containerClassName}`}>
      {projectAvatar}
      {((inSidebar && state === 'expanded') || !inSidebar) && (
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
