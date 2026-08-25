import { t } from 'i18next';
import { SquareFunction } from 'lucide-react';
import React from 'react';

import { Toggle } from '@/components/ui/toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

function DynamicValueToggleButton({
  pressed,
  onPressedChange,
  disabled,
}: DynamicValueToggleButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle
          pressed={pressed}
          onPressedChange={onPressedChange}
          disabled={disabled}
          size="sm"
          aria-label={t('Dynamic value')}
          className="shrink-0"
        >
          <SquareFunction
            className={cn('size-5', {
              'text-foreground': pressed,
              'text-muted-foreground': !pressed,
            })}
          />
        </Toggle>
      </TooltipTrigger>
      <TooltipContent side="top">{t('Dynamic value')}</TooltipContent>
    </Tooltip>
  );
}

DynamicValueToggleButton.displayName = 'DynamicValueToggleButton';

export { DynamicValueToggleButton };

type DynamicValueToggleButtonProps = {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  disabled?: boolean;
};
