import React from 'react';

import {
  HugeiconsIcon,
  type IconSvgElement,
} from '@/components/custom/hugeicons-icon';
import { Button } from '@/components/ui/button';

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, children, ...buttonProps }, ref) => {
    return (
      <Button ref={ref} {...buttonProps}>
        <HugeiconsIcon icon={icon} />
        {children}
      </Button>
    );
  },
);

IconButton.displayName = 'IconButton';

export { IconButton };

type IconButtonProps = React.ComponentProps<typeof Button> & {
  icon: IconSvgElement;
};
