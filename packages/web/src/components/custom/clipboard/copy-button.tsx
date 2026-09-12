import { t } from 'i18next';
import { Check, Copy } from 'lucide-react';
import React, { forwardRef, useState } from 'react';
import { toast } from 'sonner';

import { Button, ButtonProps } from '@/components/ui/button';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

interface CopyButtonProps extends ButtonProps {
  textToCopy: string;
  tooltipSide?: React.ComponentProps<typeof TooltipContent>['side'];
  withoutTooltip?: boolean;
  children?: React.ReactNode;
}

export const CopyButton = forwardRef<HTMLButtonElement, CopyButtonProps>(
  (
    {
      textToCopy,
      className,
      tooltipSide,
      withoutTooltip = false,
      variant = 'outline',
      children,
      ...props
    },
    ref,
  ) => {
    const [isCopied, setIsCopied] = useState(false);

    const copyToClipboard = async () => {
      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(textToCopy);
        } else {
          const textArea = document.createElement('textarea');
          textArea.value = textToCopy;
          textArea.style.position = 'fixed';
          textArea.style.opacity = '0';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 3000);
      } catch {
        toast.error(t('Failed to copy to clipboard'), {
          duration: 3000,
        });
      }
    };

    const content = (
      <>
        {isCopied ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
        {children}
      </>
    );

    if (withoutTooltip || children) {
      return (
        <Button
          ref={ref}
          variant={variant}
          size={children ? 'default' : 'icon'}
          type="button"
          className={className}
          onClick={() => copyToClipboard()}
          {...props}
        >
          {content}
        </Button>
      );
    }
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            ref={ref}
            variant={variant}
            size={'icon'}
            type="button"
            className={className}
            onClick={() => copyToClipboard()}
            {...props}
          >
            {content}
          </Button>
        </TooltipTrigger>
        <TooltipContent side={tooltipSide}>{t('Copy')}</TooltipContent>
      </Tooltip>
    );
  },
);

CopyButton.displayName = 'CopyButton';
