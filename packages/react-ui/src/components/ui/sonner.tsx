'use client';

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import { Toaster as Sonner, toast, type ToasterProps } from 'sonner';

import { useTheme } from '@/components/theme-provider';

export const INTERNAL_ERROR_MESSAGE =
  'An unexpected error occurred. Please try again in a moment.';

export function internalErrorToast() {
  toast.error('Something went wrong', {
    description: INTERNAL_ERROR_MESSAGE,
    duration: 3000,
  });
}

export const UNSAVED_CHANGES_TOAST = {
  id: 'unsaved-changes',
  title: 'Unsaved Changes',
  description:
    'Something went wrong and there are unsaved changes, please refresh and contact support if the problem persists.',
  variant: 'destructive',
  duration: Infinity,
};

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();
  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      expand={true}
      toastOptions={{
        classNames: {
          toast: `
            data-[type=error]:text-destructive-300!
            data-[type=warning]:text-warning-300!
            data-[type=success]:text-success-300!
          `,
          description: `
            data-[type=error]:text-destructive-300!
            data-[type=warning]:text-warning-300!
            data-[type=success]:text-success-300!
          `,
        },
        descriptionClassName: 'text-inherit!',
      }}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          '--normal-text': 'var(--foreground)',
          '--normal-bg': 'var(--background)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
