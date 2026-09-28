'use client';

import {
  Alert02Icon,
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
  Loading02Icon,
} from '@hugeicons/core-free-icons';
import { Toaster as Sonner, toast, type ToasterProps } from 'sonner';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { useTheme } from '@/components/providers/theme-provider';

export const INTERNAL_ERROR_MESSAGE =
  'An unexpected error occurred. Please try again in a moment.';

export function internalErrorToast() {
  console.error('internalErrorToast', INTERNAL_ERROR_MESSAGE);
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

function Toaster({ ...props }: ToasterProps) {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      theme={resolvedTheme}
      className="toaster group"
      expand={true}
      toastOptions={{
        classNames: {
          toast: `
            data-[type=error]:text-danger-11!
            data-[type=warning]:text-warning-11!
            data-[type=success]:text-success-11!
          `,
          description: `
            data-[type=error]:text-danger-11!
            data-[type=warning]:text-warning-11!
            data-[type=success]:text-success-11!
          `,
        },
        descriptionClassName: 'text-inherit!',
      }}
      icons={{
        success: (
          <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4" />
        ),
        info: <HugeiconsIcon icon={InformationCircleIcon} className="size-4" />,
        warning: <HugeiconsIcon icon={Alert02Icon} className="size-4" />,
        error: <HugeiconsIcon icon={CancelCircleIcon} className="size-4" />,
        loading: (
          <HugeiconsIcon icon={Loading02Icon} className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          '--normal-text': 'var(--gray-12)',
          '--normal-bg': 'var(--panel)',
          '--normal-border': 'var(--gray-6)',
          '--border-radius': 'var(--radius)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

export { Toaster };
