import {
  HugeiconsIcon as HugeiconsIconBase,
  type HugeiconsIconProps,
  type IconSvgElement,
} from '@hugeicons/react';
import { forwardRef } from 'react';

const HugeiconsIcon = forwardRef<SVGSVGElement, HugeiconsIconProps>(
  ({ strokeWidth = DEFAULT_ICON_STROKE_WIDTH, ...props }, ref) => (
    <HugeiconsIconBase
      ref={ref}
      strokeWidth={strokeWidth}
      aria-hidden={hasAccessibleName(props) ? undefined : true}
      {...props}
    />
  ),
);

HugeiconsIcon.displayName = 'HugeiconsIcon';

function hasAccessibleName(props: Omit<HugeiconsIconProps, 'strokeWidth'>) {
  return Object.keys(props).some(
    (key) => key.startsWith('aria-') || key === 'role' || key === 'title',
  );
}

const DEFAULT_ICON_STROKE_WIDTH = 2;

export { HugeiconsIcon };
export type { IconSvgElement };
