import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type ApTableTriggersProps = {
  trigger?: React.ReactNode;
  toolTipMessage: string;
};

export function ApTableTriggers({
  trigger,
  toolTipMessage,
}: ApTableTriggersProps) {
  return (
    <Tooltip delayDuration={50}>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent>
        <p>{toolTipMessage}</p>
      </TooltipContent>
    </Tooltip>
  );
}
