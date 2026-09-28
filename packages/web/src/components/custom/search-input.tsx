import { Cancel01Icon, Search01Icon } from '@hugeicons/core-free-icons';
import { t } from 'i18next';
import * as React from 'react';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { Input, inputClass } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import { SelectUtilButton } from './select-util-button';

export type SearchInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'onChange'
> & {
  onChange: (value: string) => void;
};

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ type, placeholder = t('Search'), ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => inputRef.current!);

    return (
      <div
        className={cn(
          'grow flex items-center gap-2 w-full bg-gray-1 px-3 box-border',
          inputClass,
        )}
      >
        <HugeiconsIcon
          icon={Search01Icon}
          className="size-4 shrink-0 opacity-50"
        />
        <Input
          {...props}
          type={type}
          ref={inputRef}
          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none p-0 bg-transparent dark:bg-transparent"
          placeholder={placeholder}
          onChange={(e) => props.onChange(e.target.value)}
        />
        {props.value !== '' && (
          <SelectUtilButton
            tooltipText={t('Clear')}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              props.onChange('');
              inputRef.current?.focus();
            }}
            Icon={Cancel01Icon}
          ></SelectUtilButton>
        )}
      </div>
    );
  },
);
SearchInput.displayName = 'SearchInput';

export { SearchInput };
