import { ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const StepNodeChevron = ({ className }: { className?: string }) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn('p-1 size-7', className)}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (e.target) {
          const rightClickEvent = new MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
            view: window,
            button: 2,
            clientX: e.clientX,
            clientY: e.clientY,
          });
          e.target.dispatchEvent(rightClickEvent);
        }
      }}
    >
      <ChevronDown className="w-4 h-4 stroke-muted-foreground" />
    </Button>
  );
};

export { StepNodeChevron };
