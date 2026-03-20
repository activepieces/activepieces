import { t } from 'i18next';
import { Search, X } from 'lucide-react';
import * as React from 'react';

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
          'grow flex items-center gap-2 w-full bg-background px-3 box-border',
          inputClass,
        )}
      >
        <Search className="size-4 shrink-0 opacity-50"></Search>
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
            Icon={X}
          ></SelectUtilButton>
        )}
      </div>
    );
  },
);
SearchInput.displayName = 'SearchInput';

export { SearchInput };
