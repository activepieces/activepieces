import { Check, Copy } from 'lucide-react';
import { forwardRef, useState, type ButtonHTMLAttributes } from 'react';

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
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore — clipboard not available
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
        'flex items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
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
