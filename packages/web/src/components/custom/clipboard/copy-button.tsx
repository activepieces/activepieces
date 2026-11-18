import { t } from 'i18next';
import { Check, Copy } from 'lucide-react';
import React, { forwardRef } from 'react';

import { Button, ButtonProps } from '@/components/ui/button';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

import { CopyParams, useCopyToClipboard } from './use-copy-to-clipboard';

export const CopyButton = forwardRef<HTMLButtonElement, CopyButtonProps>(
  (
    {
      value,
      tooltipSide,
      withoutTooltip = false,
      variant = 'outline',
      children,
      onClick,
      ...props
    },
    ref,
  ) => {
    const { isCopied, copy } = useCopyToClipboard();

    const button = (
      <Button
        ref={ref}
        variant={variant}
        size={children ? 'default' : 'icon'}
        type="button"
        aria-label={children ? undefined : t('Copy')}
        {...props}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) {
            copy({ value });
          }
        }}
      >
        {isCopied ? <Check /> : <Copy />}
        {children}
      </Button>
    );

    if (withoutTooltip || children) {
      return button;
    }
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side={tooltipSide}>{t('Copy')}</TooltipContent>
      </Tooltip>
    );
  },
);

CopyButton.displayName = 'CopyButton';

type CopyButtonProps = Omit<ButtonProps, 'value'> &
  CopyParams & {
    tooltipSide?: React.ComponentProps<typeof TooltipContent>['side'];
    withoutTooltip?: boolean;
    children?: React.ReactNode;
  };
