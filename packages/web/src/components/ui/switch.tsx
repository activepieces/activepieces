import * as React from 'react';
import { Switch as SwitchPrimitive } from 'radix-ui';

import { cn } from '@/lib/utils';

function Switch({
  className,
  checkedIcon,
  uncheckedIcon,
  onCheckedChange,
  variant = 'default',
  size = 'default',
  color = 'default',
  ...props
}: SwitchProps) {
  const isControlled = props.checked !== undefined;

  const [internalChecked, setInternalChecked] = React.useState(
    props.defaultChecked ?? false,
  );
  const isChecked = isControlled ? props.checked : internalChecked;

  const effectiveCheckedIcon = checkedIcon;
  const effectiveUncheckedIcon = uncheckedIcon || checkedIcon;
  const icon = isChecked ? effectiveCheckedIcon : effectiveUncheckedIcon;

  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer inline-flex shrink-0 cursor-pointer items-center border-2 border-transparent transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
        COLOR_CLASSES[color],
        variant === 'square' ? 'rounded-md' : 'rounded-full',
        SIZE_CLASSES[size],
        className,
      )}
      onCheckedChange={(checked) =>
        handleCheckedChange(checked, isControlled, setInternalChecked, onCheckedChange)
      }
      {...props}
      checked={isChecked}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'pointer-events-none flex items-center justify-center bg-background dark:bg-foreground shadow-lg ring-0 transition-transform data-[state=unchecked]:translate-x-0',
          variant === 'square' ? 'rounded-sm' : 'rounded-full',
          THUMB_SIZE_CLASSES[size],
        )}
      >
        {icon && (
          <span className="flex items-center justify-center">{icon}</span>
        )}
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  );
}

// Constants

const SIZE_CLASSES: Record<NonNullable<SwitchProps['size']>, string> = {
  sm: 'h-4 w-8',
  default: 'h-5 w-10',
  lg: 'h-7 w-14',
  xl: 'h-8 w-16',
};

const THUMB_SIZE_CLASSES: Record<NonNullable<SwitchProps['size']>, string> = {
  sm: 'h-3 w-3 data-[state=checked]:translate-x-4',
  default: 'h-4 w-4 data-[state=checked]:translate-x-5',
  lg: 'h-5 w-5 data-[state=checked]:translate-x-6',
  xl: 'h-6 w-6 data-[state=checked]:translate-x-7',
};

const COLOR_CLASSES: Record<NonNullable<SwitchProps['color']>, string> = {
  default:
    'data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
  secondary:
    'data-[state=checked]:bg-secondary data-[state=unchecked]:bg-input',
};

// Helper functions

function handleCheckedChange(
  checked: boolean,
  isControlled: boolean,
  setInternalChecked: React.Dispatch<React.SetStateAction<boolean>>,
  onCheckedChange?: (checked: boolean) => void,
) {
  if (!isControlled) {
    setInternalChecked(checked);
  }
  if (onCheckedChange) {
    onCheckedChange(checked);
  }
}

// Type definitions

type SwitchProps = React.ComponentProps<typeof SwitchPrimitive.Root> & {
  checkedIcon?: React.ReactNode;
  uncheckedIcon?: React.ReactNode;
  variant?: 'default' | 'square';
  size?: 'default' | 'sm' | 'lg' | 'xl';
  color?: 'default' | 'secondary';
};

export { Switch };
export type { SwitchProps };
