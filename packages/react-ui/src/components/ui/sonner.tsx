'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';

type SonnerToasterProps = React.ComponentProps<typeof Sonner>;

const SonnerToaster = ({ ...props }: SonnerToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as SonnerToasterProps['theme']}
      expand={false}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
      {...props}
    />
  );
};

export { SonnerToaster };
