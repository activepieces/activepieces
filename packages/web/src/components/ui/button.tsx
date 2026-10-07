import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import * as React from 'react';

import { Shortcut } from '@/components/custom/shortcut';
import { LoadingSpinner } from '@/components/custom/spinner';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-gray-8 focus-visible:ring-3 focus-visible:ring-gray-8/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-danger-9 aria-invalid:ring-3 aria-invalid:ring-danger-9/20 dark:aria-invalid:ring-danger-9/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'bg-accent-9 stroke-on-accent text-on-accent hover:bg-accent-9/90',
        outline:
          'border-gray-6 bg-gray-1 shadow-xs hover:bg-gray-4 hover:text-gray-12 aria-expanded:bg-gray-4 aria-expanded:text-gray-12',
        secondary:
          'bg-gray-3 text-gray-12 hover:bg-gray-4 aria-expanded:bg-gray-4 aria-expanded:text-gray-12',
        ghost:
          'hover:bg-gray-4 hover:text-gray-12 aria-expanded:bg-gray-4 aria-expanded:text-gray-12',
        destructive:
          'bg-danger-3 text-danger-11 hover:bg-danger-4 focus-visible:border-danger-8 focus-visible:ring-danger-9/20 dark:focus-visible:ring-danger-9/40',
        link: 'text-accent-11 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-3 has-[>svg]:px-2.5',
        xs: "h-7 gap-1 px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        sm: 'h-8 gap-1.5 px-2.5 has-[>svg]:px-2',
        lg: 'h-10 px-4 has-[>svg]:px-3.5',
        icon: 'size-9',
        'icon-xs': "size-7 [&_svg:not([class*='size-'])]:size-3.5",
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    compoundVariants: [
      {
        variant: 'link',
        class: 'px-0 has-[>svg]:px-0',
      },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function useKeyboardShortcut(
  keyboardShortcut: string | undefined,
  disabled: boolean | undefined,
  onKeyboardShortcut: (() => void) | undefined,
) {
  React.useEffect(() => {
    if (!keyboardShortcut) return;

    const isMac = /(Mac)/i.test(navigator.userAgent);
    const isEscape = keyboardShortcut.toLocaleLowerCase() === 'esc';

    const handleKeyDown = (event: KeyboardEvent) => {
      const isEscapePressed = event.key === 'Escape' && isEscape;
      const isCtrlWithShortcut =
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

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [keyboardShortcut, disabled, onKeyboardShortcut]);
}

function renderButtonContent(
  loading: boolean,
  variant: ButtonProps['variant'],
  keyboardShortcut: string | undefined,
  children: React.ReactNode,
) {
  if (loading) {
    return (
      <LoadingSpinner
        className={cn('size-4', {
          'stroke-on-accent': variant === 'default',
          'stroke-danger-11': variant === 'destructive',
          'stroke-gray-12': variant !== 'default' && variant !== 'destructive',
        })}
      />
    );
  }

  if (keyboardShortcut) {
    return (
      <span className="flex items-center justify-center gap-2">
        {children}
        <Shortcut
          shortcutKey={keyboardShortcut}
          withCtrl={true}
          className={cn({
            'text-on-accent/70': variant === 'default',
            'text-danger-11/70': variant === 'destructive',
          })}
        />
      </span>
    );
  }

  return children;
}

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  loading = false,
  keyboardShortcut,
  onKeyboardShortcut,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button';

  useKeyboardShortcut(
    keyboardShortcut,
    disabled || loading,
    onKeyboardShortcut,
  );

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
        if (loading) {
          e.stopPropagation();
        } else if (props.onClick) {
          props.onClick(e);
        }
      }}
    >
      {renderButtonContent(loading, variant, keyboardShortcut, children)}
    </Comp>
  );
}

export { Button, buttonVariants };
export type { ButtonProps };

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
    keyboardShortcut?: string;
    onKeyboardShortcut?: () => void;
  };
