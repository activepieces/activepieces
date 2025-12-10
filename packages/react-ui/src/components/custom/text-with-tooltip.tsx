import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TextWithTooltipProps {
  tooltipMessage: string;
  renderTrigger: () => React.ReactNode;
}

export const TextWithTooltip = ({
  tooltipMessage,
  renderTrigger,
}: TextWithTooltipProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{renderTrigger()}</TooltipTrigger>
        <TooltipContent className="max-w-md wrap-break-word whitespace-normal">
          <p>{tooltipMessage}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
