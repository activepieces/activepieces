import {
  Alert02Icon,
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
  } from '@hugeicons/core-free-icons';
import { t } from 'i18next';
import { Toaster as Sonner, toast, type ToasterProps } from 'sonner';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { useTheme } from '@/components/providers/theme-provider';
import {
  INTERNAL_ERROR_MESSAGE,
  MUTATION_ERROR_TOAST_ID,
} from '@/lib/mutation-feedback';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

export { INTERNAL_ERROR_MESSAGE };

export function internalErrorToast() {
  console.error('internalErrorToast', INTERNAL_ERROR_MESSAGE);
  toast.error(t('Something went wrong'), {
    id: MUTATION_ERROR_TOAST_ID,
    description: t(INTERNAL_ERROR_MESSAGE),
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
      className="group"
      expand={true}
      toastOptions={{
        classNames: {
          toast: cn(
            'rounded-xl! bg-panel! shadow-over!',
            'data-[type=error]:text-danger-11! data-[type=warning]:text-warning-11! data-[type=success]:text-success-11!',
          ),
          title: 'text-sm!',
          description: cn(
            'text-sm!',
            'data-[type=error]:text-danger-11! data-[type=warning]:text-warning-11! data-[type=success]:text-success-11!',
          ),
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
          <Spinner className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          '--normal-text': 'var(--gray-12)',
          '--normal-bg': 'var(--panel)',
          '--normal-border': 'transparent',
          '--border-radius': '16px',
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

export { Toaster };
