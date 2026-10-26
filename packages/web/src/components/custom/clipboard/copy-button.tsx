import { t } from 'i18next';
import { Check, Copy } from 'lucide-react';
import React, { forwardRef } from 'react';

import { Button, ButtonProps } from '@/components/ui/button';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

import { useCopyToClipboard } from './use-copy-to-clipboard';

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
    const { isCopied, copy } = useCopyToClipboard();
    const copyToClipboard = () => copy(textToCopy);

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
