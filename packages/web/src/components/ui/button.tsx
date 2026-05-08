import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import * as React from 'react';

import { Shortcut } from '@/components/custom/shortcut';
import { LoadingSpinner } from '@/components/custom/spinner';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-normal whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'bg-primary stroke-background text-primary-foreground enabled:hover:bg-primary/90',
        basic:
          'text-primary font-medium underline-offset-4 enabled:hover:bg-accent',
        secondary:
          'text-secondary-foreground bg-secondary enabled:hover:bg-secondary/80 enabled:hover:text-secondary-foreground',
        destructive:
          'bg-destructive text-white enabled:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40',
        outline:
          'border-input bg-background enabled:hover:bg-accent enabled:hover:text-accent-foreground border',
        accent: 'bg-accent text-accent-foreground enabled:hover:bg-accent/80',
        ghost:
          'hover:bg-gray-300/30 hover:text-accent-foreground dark:hover:bg-gray-300/10',
        link: 'text-primary underline-offset-4 hover:underline',
        transparent: 'text-primary enabled:hover:bg-transparent',
      },
      size: {
        default: 'h-9 px-3 py-2 has-[>svg]:px-2.5',
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: 'h-8 gap-1.5 rounded-md px-2.5 has-[>svg]:px-2',
        lg: 'h-10 rounded-md px-5 has-[>svg]:px-4',
        xl: 'h-11 rounded-md px-8 has-[>svg]:px-6',
        icon: 'size-9',
        'icon-xs': "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    compoundVariants: [
      {
        variant: 'link',
        class: 'px-0',
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
        className={cn('size-5', {
          'stroke-background': variant === 'default' || variant === 'secondary',
          'stroke-foreground': variant !== 'default' && variant !== 'secondary',
        })}
      />
    );
  }

  if (keyboardShortcut) {
    return (
      <div className="flex justify-center items-center gap-2">
        {children}
        <Shortcut shortcutKey={keyboardShortcut} withCtrl={true} />
      </div>
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

  useKeyboardShortcut(keyboardShortcut, disabled, onKeyboardShortcut);

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
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
