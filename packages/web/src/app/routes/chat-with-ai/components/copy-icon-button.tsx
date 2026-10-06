import { Copy01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import { t } from 'i18next';
import { forwardRef, useState, type ButtonHTMLAttributes } from 'react';
import { toast } from 'sonner';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { cn } from '@/lib/utils';

export const CopyIconButton = forwardRef<
  HTMLButtonElement,
  {
    textToCopy: string;
    className?: string;
  } & ButtonHTMLAttributes<HTMLButtonElement>
>(function CopyIconButton({ textToCopy, className, ...rest }, ref) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error(t('Failed to copy to clipboard'));
    }
  };

  return (
    <button
      ref={ref}
      type="button"
      {...rest}
      onClick={(event) => {
        rest.onClick?.(event);
        if (!event.defaultPrevented) handleCopy();
      }}
      className={cn(
        'flex items-center justify-center rounded-md text-gray-11 transition-colors hover:bg-gray-3 hover:text-gray-12',
        className,
      )}
    >
      {copied ? (
        <HugeiconsIcon icon={Tick02Icon} className="h-3.5 w-3.5" />
      ) : (
        <HugeiconsIcon icon={Copy01Icon} className="h-3.5 w-3.5" />
      )}
    </button>
  );
});
