import * as SwitchPrimitives from '@radix-ui/react-switch';
import * as React from 'react';

import { cn } from '../../lib/utils';

export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  checkedIcon?: React.ReactNode;
  uncheckedIcon?: React.ReactNode;
  variant?: 'default' | 'square';
  size?: 'default' | 'sm' | 'lg' | 'xl';
  color?: 'default' | 'secondary';
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(
  (
    {
      className,
      checkedIcon,
      uncheckedIcon,
      onCheckedChange,
      variant = 'default',
      size = 'default',
      color = 'default',
      ...props
    },
    ref,
  ) => {
    const isControlled = props.checked !== undefined;

    const [internalChecked, setInternalChecked] = React.useState(
      props.defaultChecked ?? false,
    );
    const isChecked = isControlled ? props.checked : internalChecked;

    const handleCheckedChange = (checked: boolean) => {
      if (!isControlled) {
        setInternalChecked(checked);
      }
      if (onCheckedChange) {
        onCheckedChange(checked);
      }
    };

    const effectiveCheckedIcon = checkedIcon;
    const effectiveUncheckedIcon = uncheckedIcon || checkedIcon;
    const icon = isChecked ? effectiveCheckedIcon : effectiveUncheckedIcon;

    const sizeClasses = {
      sm: 'h-4 w-8',
      default: 'h-5 w-10',
      lg: 'h-7 w-14',
      xl: 'h-8 w-16',
    };

    const thumbSizeClasses = {
      sm: 'h-3 w-3 data-[state=checked]:translate-x-4',
      default: 'h-4 w-4 data-[state=checked]:translate-x-5',
      lg: 'h-5 w-5 data-[state=checked]:translate-x-6',
      xl: 'h-6 w-6 data-[state=checked]:translate-x-7',
    };

    const colorClasses: Record<NonNullable<SwitchProps['color']>, string> = {
      default:
        'data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
      secondary:
        'data-[state=checked]:bg-secondary data-[state=unchecked]:bg-input',
    };

    return (
      <SwitchPrimitives.Root
        className={cn(
          'peer inline-flex shrink-0 cursor-pointer items-center border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
          colorClasses[color],
          variant === 'square' ? 'rounded-md' : 'rounded-full',
          sizeClasses[size],
          className,
        )}
        onCheckedChange={handleCheckedChange}
        {...props}
        checked={isChecked}
        ref={ref}
      >
        <SwitchPrimitives.Thumb
          className={cn(
            'pointer-events-none flex items-center justify-center bg-background shadow-lg ring-0 transition-transform data-[state=unchecked]:translate-x-0',
            variant === 'square' ? 'rounded-sm' : 'rounded-full',
            thumbSizeClasses[size],
            // thumbColorClasses[color]
          )}
        >
          {icon && (
            <span className="flex items-center justify-center">{icon}</span>
          )}
        </SwitchPrimitives.Thumb>
      </SwitchPrimitives.Root>
    );
  },
);
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
