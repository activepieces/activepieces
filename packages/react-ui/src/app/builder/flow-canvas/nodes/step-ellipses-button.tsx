import { EllipsisVertical } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { useBuilderStateContext } from '../../builder-hooks';

export const StepEllipsesButton = ({ stepName }: { stepName: string }) => {
  const [readonly] = useBuilderStateContext((state) => [state.readonly]);
  if (readonly && stepName === 'trigger') return null;
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
      className="!size-[28px] !rounded-xs z-20 opacity-0  border  !border-slate-500/50 text-slate-500 dark:text-slate-200  group-hover:opacity-100 transition-all duration-300 flex items-center justify-center absolute -top-1 -right-1"
    >
      <EllipsisVertical className="size-4" />
    </Button>
  );
};
