import { EllipsisVertical } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ActionType, TriggerType } from '@activepieces/shared';

import { useBuilderStateContext } from '../../builder-hooks';

export const StepEllipsesButton = ({
  stepName,
  type,
}: {
  stepName: string;
  type: ActionType | TriggerType;
}) => {
  const [readonly] = useBuilderStateContext((state) => [state.readonly]);
  if ((readonly && stepName === 'trigger') || type === TriggerType.EMPTY)
    return null;
  return (
    <Button
      onClick={(e) => {
        e.preventDefault();
        const rightClickEvent = new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          view: window,
          button: 2, // Right mouse button
          clientX: e.clientX,
          clientY: e.clientY,
        });
        e.target.dispatchEvent(rightClickEvent);
      }}
      variant="accent"
      className="!size-[28px] !rounded-sm z-20 opacity-0  !shadow-bordered shadow-border    !border-transparent text-slate-500 dark:text-slate-200  group-hover:opacity-100  hover:bg-background hover:text-foreground transition-all duration-300 flex items-center justify-center absolute -top-2 -right-2"
    >
      <EllipsisVertical className="size-4" />
    </Button>
  );
};
