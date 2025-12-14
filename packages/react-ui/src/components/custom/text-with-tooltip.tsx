import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TextWithTooltipProps {
  tooltipMessage: string;
  children: React.ReactNode;
}

export const TextWithTooltip = ({
  tooltipMessage,
  children,
}: TextWithTooltipProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        {tooltipMessage && (
          <TooltipContent className="max-w-md wrap-break-word whitespace-normal">
            <p>{tooltipMessage}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};
