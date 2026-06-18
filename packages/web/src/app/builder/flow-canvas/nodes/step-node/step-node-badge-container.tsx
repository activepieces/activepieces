import React from 'react';

import { cn } from '@/lib/utils';

import { useBuilderStateContext } from '../../../builder-hooks';
import { flowScreenshotUtils } from '../../utils/flow-screenshot-utils';

export function StepNodeBadgeContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const canvasOrientation = useBuilderStateContext(
    (state) => state.canvasOrientation,
  );
  return (
    <div
      {...{ [flowScreenshotUtils.SCREENSHOT_EXCLUDE_ATTRIBUTE]: 'ignore-me' }}
      className={cn('absolute h-[20px] -top-[28px] whitespace-nowrap', {
        'right-[1px]': canvasOrientation === 'vertical',
        'left-1/2 -translate-x-1/2 flex justify-center':
          canvasOrientation === 'horizontal',
      })}
    >
      {children}
    </div>
  );
}
