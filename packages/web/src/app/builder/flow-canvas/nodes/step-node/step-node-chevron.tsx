import { ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { flowScreenshotUtils } from '../../utils/flow-screenshot-utils';

const StepNodeChevron = ({
  onClickOverride,
}: {
  onClickOverride?: () => void;
}) => {
  return (
    <Button
      {...{ [flowScreenshotUtils.SCREENSHOT_EXCLUDE_ATTRIBUTE]: 'ignore-me' }}
      variant="ghost"
      size="sm"
      className="p-1 size-7 "
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (onClickOverride) {
          onClickOverride();
          return;
        }
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
