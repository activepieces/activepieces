import React, { useCallback, useRef } from 'react';

import { Button } from '@/components/ui/button';

const AnimatedIconButton = React.forwardRef<
  HTMLButtonElement,
  AnimatedIconButtonProps
>(({ icon: Icon, iconSize = 16, children, ...buttonProps }, ref) => {
  const iconRef = useRef<AnimatedIconHandle>(null);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      iconRef.current?.startAnimation();
      buttonProps.onMouseEnter?.(e);
    },
    [buttonProps.onMouseEnter],
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      iconRef.current?.stopAnimation();
      buttonProps.onMouseLeave?.(e);
    },
    [buttonProps.onMouseLeave],
  );

  return (
    <Button
      ref={ref}
      {...buttonProps}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Icon ref={iconRef} size={iconSize} />
      {children}
    </Button>
  );
});

AnimatedIconButton.displayName = 'AnimatedIconButton';

export { AnimatedIconButton };

type AnimatedIconHandle = {
  startAnimation: () => void;
  stopAnimation: () => void;
};

type AnimatedIconButtonProps = React.ComponentProps<typeof Button> & {
  icon: React.ForwardRefExoticComponent<
    { size?: number } & React.RefAttributes<AnimatedIconHandle>
  >;
  iconSize?: number;
};
