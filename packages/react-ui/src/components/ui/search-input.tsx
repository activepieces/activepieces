import { t } from 'i18next';
import { ArrowLeft, Search, X } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

import { SelectUtilButton } from '../custom/select-util-button';

import { Button } from './button';

export type SearchInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'onChange'
> & {
  onChange: (value: string) => void;
  showDeselect: boolean;
  showBackButton?: boolean;
};

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ type, showDeselect, showBackButton, ...props }, ref) => {
    return (
      <div
        className={cn(
          'flex-grow flex  items-center gap-2 w-full  bg-background px-3 focus-within:outline-none first:disabled:cursor-not-allowed first:disabled:opacity-50 box-border',
          {
            'pl-1': showBackButton,
          },
        )}
      >
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => props.onChange('')}
          >
            <ArrowLeft className="size-4 shrink-0"></ArrowLeft>
          </Button>
        )}
        {!showBackButton && (
          <Search className="size-4 shrink-0 opacity-50"></Search>
        )}
        <input
          className="rounded-md bg-transparent h-9 grow text-sm outline-none placeholder:text-muted-foreground"
          type={type}
          ref={ref}
          {...props}
          onChange={(e) => props.onChange(e.target.value)}
        />
        {showDeselect && (
          <SelectUtilButton
            tooltipText={t('Clear')}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              props.onChange('');
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
