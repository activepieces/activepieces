import { isNil } from '@activepieces/shared';
import { t } from 'i18next';
import { X } from 'lucide-react';

import { Input, InputProps } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import { SelectUtilButton } from './select-util-button';

function ClearableInput({
  onClear,
  showClear,
  ...inputProps
}: ClearableInputProps) {
  const shouldShowClear =
    showClear ?? (!isNil(inputProps.value) && inputProps.value !== '');

  return (
    <div className="relative">
      <Input
        {...inputProps}
        className={cn(inputProps.className, shouldShowClear && 'pr-9')}
      />
      {shouldShowClear && !inputProps.disabled && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <SelectUtilButton
            tooltipText={t('Clear')}
            onClick={() => onClear()}
            Icon={X}
          />
        </div>
      )}
    </div>
  );
}

type ClearableInputProps = InputProps & {
  onClear: () => void;
  showClear?: boolean;
};

export { ClearableInput };
export type { ClearableInputProps };
