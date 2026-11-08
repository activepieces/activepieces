import { t } from 'i18next';
import { Check, Copy } from 'lucide-react';
import { forwardRef, useState, type ButtonHTMLAttributes } from 'react';
import { toast } from 'sonner';

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
      aria-label={copied ? t('Copied') : t('Copy')}
      {...rest}
      onClick={(event) => {
        rest.onClick?.(event);
        if (!event.defaultPrevented) handleCopy();
      }}
      className={cn(
        'flex items-center justify-center rounded-md text-gray-11 transition-colors outline-none hover:bg-gray-3 hover:text-gray-12 focus-visible:ring-2 focus-visible:ring-gray-8',
        className,
      )}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
});
