import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TextWithTooltipProps {
  fullText: string;
  renderTrigger: (text: string) => React.ReactNode;
}

export const TextWithTooltip = ({
  fullText,
  renderTrigger,
}: TextWithTooltipProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{renderTrigger(fullText)}</TooltipTrigger>
        <TooltipContent className="max-w-md break-words whitespace-normal">
          <p>{fullText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
