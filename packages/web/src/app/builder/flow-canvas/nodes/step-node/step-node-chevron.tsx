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
      size="icon-xs"
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
      <ChevronDown className="size-4 stroke-gray-11" />
    </Button>
  );
};

export { StepNodeChevron };
