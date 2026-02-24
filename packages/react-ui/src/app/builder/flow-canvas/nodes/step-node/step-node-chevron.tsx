import { ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';

const StepNodeChevron = () => {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="p-1 size-7 "
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
