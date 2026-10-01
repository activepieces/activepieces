import { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const SelectUtilButton = ({
  onClick,
  Icon,
  tooltipText,
}: {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  Icon: LucideIcon;
  tooltipText?: string;
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          className="shrink-0 text-gray-11"
          size="icon-xs"
          type="button"
          onClick={onClick}
        >
          <Icon />
        </Button>
      </TooltipTrigger>
      {tooltipText && (
        <TooltipContent side="bottom">{tooltipText}</TooltipContent>
      )}
    </Tooltip>
  );
};

SelectUtilButton.displayName = 'SelectUtilButton';
export { SelectUtilButton };
