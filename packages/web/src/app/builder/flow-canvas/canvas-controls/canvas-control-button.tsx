import { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

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
          size="icon"
          disabled={disabled}
          onClick={onClick}
        >
          <Icon className={cn('size-4', iconClassName)} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
};

export { CanvasControlButton };
