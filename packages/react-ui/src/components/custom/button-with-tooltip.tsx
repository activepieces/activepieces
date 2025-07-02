import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type ButtonWithTooltipProps = {
  tooltip: string;
  onClick: (e?: React.MouseEvent) => void;
  variant?:
    | 'ghost'
    | 'outline'
    | 'default'
    | 'destructive'
    | 'secondary'
    | 'link';
  icon: React.ReactNode;
  className?: string;
  disabled?: boolean;
  hasPermission?: boolean;
};

export const ButtonWithTooltip = ({
  tooltip,
  onClick,
  variant = 'ghost',
  icon,
  className = 'h-7 w-7',
  disabled = false,
  hasPermission = true,
}: ButtonWithTooltipProps) => (
  <PermissionNeededTooltip hasPermission={hasPermission}>
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size="icon"
            className={className}
            onClick={onClick}
            disabled={disabled || !hasPermission}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </PermissionNeededTooltip>
);
