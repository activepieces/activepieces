import {
  HugeiconsIcon,
  type IconSvgElement,
} from '@/components/custom/hugeicons-icon';
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
  Icon: IconSvgElement;
  tooltipText?: string;
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          className="opacity-50 shrink-0 h-6 w-6 rounded-xs"
          size={'icon'}
          type="button"
          onClick={onClick}
        >
          <HugeiconsIcon icon={Icon} className="w-4 h-4" />
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
