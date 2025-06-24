import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

import { Shortcut } from './shortcut';
import { LoadingSpinner } from './spinner';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
        basic: 'text-primary underline-offset-4 enabled:hover:bg-accent',
        destructive:
          'bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        neutral:
          'text-background bg-foreground enabled:hover:bg-foreground/80 enabled:hover:text-background',
        secondary:
          'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
        ghost:
          'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
        transparent: 'text-primary enabled:hover:bg-transparent',
        'outline-primary':
          'text-primary font-medium enabled:hover:bg-primary/10 enabled:hover:border-primary enabled:hover:font-semibold',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
        xs: 'h-6 p-2',
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
          <LoadingSpinner
            className={
              variant === 'default' || variant === 'neutral'
                ? 'stroke-background'
                : 'stroke-foreground'
            }
          />
        ) : (
          <>
            {keyboardShortcut && (
              <div className="flex justify-center items-center gap-2">
                {children}
                <Shortcut shortcutKey={keyboardShortcut} withCtrl={true} />
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
