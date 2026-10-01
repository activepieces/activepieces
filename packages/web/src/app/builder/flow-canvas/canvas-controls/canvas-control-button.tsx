import { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

const CanvasControlButton = ({
  tooltip,
  icon: Icon,
  iconClassName,
  active = false,
  disabled = false,
  onClick,
}: {
  tooltip: string;
  icon: LucideIcon;
  iconClassName?: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={active ? 'default' : 'ghost'}
          size="icon-sm"
          disabled={disabled}
          onClick={onClick}
        >
          <Icon className={iconClassName} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
};

export { CanvasControlButton };
