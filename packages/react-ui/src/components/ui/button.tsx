import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

import { LoadingSpinner } from './spinner';

const buttonVariants = cva(
  'ring-offset-background focus-visible:ring-ring inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        basic: 'text-primary underline-offset-4 hover:bg-accent',
        destructive: 'bg-destructive text-background hover:bg-destructive/90',
        outline:
          'border-input bg-background hover:bg-accent hover:text-accent-foreground border',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        transparent: 'text-primary hover:bg-primary/10',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  keyboardShortcut?: string;
  onKeyboardShortcut?: () => void;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      keyboardShortcut,
      disabled,
      onKeyboardShortcut,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';

    const isMac = /(Mac)/i.test(navigator.userAgent);
    const isEscape = keyboardShortcut?.toLocaleLowerCase() === 'esc';
    React.useEffect(() => {
      if (keyboardShortcut) {
        document.addEventListener('keydown', handleKeyDown);
      }

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [keyboardShortcut, disabled]);

    const handleKeyDown = (event: KeyboardEvent) => {
      const isEscapePressed = event.key === 'Escape' && isEscape;
      const isCtrlWithShortcut =
        keyboardShortcut &&
        event.key === keyboardShortcut.toLocaleLowerCase() &&
        (isMac ? event.metaKey : event.ctrlKey);
      if (isEscapePressed || isCtrlWithShortcut) {
        event.preventDefault();
        event.stopPropagation();
        if (onKeyboardShortcut && !disabled) {
          onKeyboardShortcut();
        }
      }
    };

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }), {})}
        ref={ref}
        disabled={disabled || loading}
        {...props}
        onClick={(e) => {
          loading ? e.stopPropagation() : props.onClick && props.onClick(e);
        }}
      >
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {keyboardShortcut && (
              <div className="flex justify-center items-center gap-2">
                {children}
                <span className="flex-grow text-xs tracking-widest text-muted-foreground">
                  {!isEscape && (isMac ? '⌘' : 'Ctrl')}{' '}
                  {keyboardShortcut.toString().toLocaleUpperCase()}
                </span>
              </div>
            )}
            {!keyboardShortcut && children}
          </>
        )}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
