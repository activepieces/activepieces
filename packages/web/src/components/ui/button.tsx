import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import * as React from 'react';

import { Shortcut } from '@/components/custom/shortcut';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-accent-8 focus-visible:ring-3 focus-visible:ring-accent-8/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-danger-9 aria-invalid:ring-3 aria-invalid:ring-danger-9/20 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-accent-9 text-on-accent hover:bg-accent-9/90',
        outline:
          'border-gray-7 bg-panel shadow-xs hover:bg-gray-3 hover:text-gray-12 aria-expanded:bg-gray-3 aria-expanded:text-gray-12',
        secondary:
          'bg-gray-3 text-gray-12 hover:bg-gray-4 aria-expanded:bg-gray-4',
        ghost:
          'hover:bg-gray-3 hover:text-gray-12 aria-expanded:bg-gray-3 aria-expanded:text-gray-12',
        destructive:
          'bg-danger-3 text-danger-11 hover:bg-danger-4 focus-visible:border-danger-8 focus-visible:ring-danger-9/20',
        link: 'text-accent-11 underline-offset-4 hover:underline',
      },
      size: {
        default:
          "h-9 gap-2 px-3 text-sm has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-4",
        xs: "h-7 gap-1 px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-8 gap-1.5 px-2.5 text-sm has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-4",
        lg: "h-10 gap-2 px-3 text-sm has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-4",
        icon: "size-9 [&_svg:not([class*='size-'])]:size-4",
        'icon-xs': "size-7 [&_svg:not([class*='size-'])]:size-3.5",
        'icon-sm': "size-8 [&_svg:not([class*='size-'])]:size-4",
        'icon-lg': "size-10 [&_svg:not([class*='size-'])]:size-4",
      },
    },
    compoundVariants: [
      {
        variant: 'link',
        class: 'h-auto px-0',
      },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

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
  onClick,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button';

  useKeyboardShortcut({
    keyboardShortcut,
    disabled: disabled || loading,
    onKeyboardShortcut,
  });

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
        if (loading) {
          event.stopPropagation();
          return;
        }
        onClick?.(event);
      }}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <ButtonContent
          loading={loading}
          keyboardShortcut={keyboardShortcut}
          variant={variant}
        >
          {children}
        </ButtonContent>
      )}
    </Comp>
  );
}

function ButtonContent({
  loading,
  keyboardShortcut,
  variant,
  children,
}: {
  loading: boolean;
  keyboardShortcut: string | undefined;
  variant: ButtonProps['variant'];
  children: React.ReactNode;
}) {
  if (loading) {
    return <Spinner />;
  }
  if (!keyboardShortcut) {
    return children;
  }
  return (
    <>
      {children}
      <Shortcut
        shortcutKey={keyboardShortcut}
        withCtrl={true}
        className={cn('text-xs font-normal opacity-70', {
          'text-on-accent': variant === 'default',
        })}
      />
    </>
  );
}

function useKeyboardShortcut({
  keyboardShortcut,
  disabled,
  onKeyboardShortcut,
}: {
  keyboardShortcut: string | undefined;
  disabled: boolean | undefined;
  onKeyboardShortcut: (() => void) | undefined;
}) {
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

export { Button, buttonVariants };

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
    keyboardShortcut?: string;
    onKeyboardShortcut?: () => void;
  };

export type { ButtonProps };
