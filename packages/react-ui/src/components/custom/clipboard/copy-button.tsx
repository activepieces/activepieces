import { TooltipContentProps } from '@radix-ui/react-tooltip';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Check, Copy } from 'lucide-react';
import { forwardRef, useState } from 'react';
import { toast } from 'sonner';

import { Button, ButtonProps } from '@/components/ui/button';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

interface CopyButtonProps extends ButtonProps {
  textToCopy: string;
  tooltipSide?: TooltipContentProps['side'];
  withoutTooltip?: boolean;
  children?: React.ReactNode;
  variant?: 'ghost' | 'outline';
}

export const CopyButton = forwardRef<HTMLButtonElement, CopyButtonProps>(
  (
    {
      textToCopy,
      className,
      tooltipSide,
      withoutTooltip = false,
      variant = 'outline',
      ...props
    },
    ref,
  ) => {
    const [isCopied, setIsCopied] = useState(false);

    const { mutate: copyToClipboard } = useMutation({
      mutationFn: async () => {
        await navigator.clipboard.writeText(textToCopy);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 1500);
      },
      onError: () => {
        toast.error(t('Failed to copy to clipboard'), {
          duration: 3000,
        });
      },
    });

    if (withoutTooltip) {
      return (
        <Button
          ref={ref}
          variant={variant}
          size={'icon'}
          type="button"
          className={className}
          onClick={() => copyToClipboard()}
          {...props}
        >
          {isCopied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
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
            {isCopied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side={tooltipSide}>{t('Copy')}</TooltipContent>
      </Tooltip>
    );
  },
);

CopyButton.displayName = 'CopyButton';
