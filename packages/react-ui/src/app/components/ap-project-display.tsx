import { Avatar } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PROJECT_COLOR_PALETTE, ProjectIcon } from '@activepieces/shared';

type ApProjectDisplayProps = {
  title: string;
  icon?: ProjectIcon;
  containerClassName?: string;
  titleClassName?: string;
  maxLengthToNotShowTooltip?: number;
};

export const ApProjectDisplay = ({
  title,
  icon,
  containerClassName = '',
  titleClassName = '',
  maxLengthToNotShowTooltip = 30,
}: ApProjectDisplayProps) => {
  const projectAvatar = icon ? (
    <Avatar
      className="size-6 flex items-center justify-center rounded-sm"
      style={{
        backgroundColor: PROJECT_COLOR_PALETTE[icon.color].color,
        color: PROJECT_COLOR_PALETTE[icon.color].textColor,
      }}
    >
      {title.charAt(0).toUpperCase()}
    </Avatar>
  ) : null;

  const shouldShowTooltip = title.length > maxLengthToNotShowTooltip;
  const displayText = shouldShowTooltip
    ? `${title.substring(0, maxLengthToNotShowTooltip)}...`
    : title;

  const content = (
    <div className={`flex items-center gap-2 ${containerClassName}`}>
      {projectAvatar}
      <span className={titleClassName}>{displayText}</span>
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
