'use client';

import { XIcon } from 'lucide-react';
import { forwardRef, useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

import { Badge } from './badge';
import { Button } from './button';
import type { InputProps } from './input';

type TagInputProps = Omit<InputProps, 'value' | 'onChange'> & {
  value?: ReadonlyArray<string>;
  onChange: (value: ReadonlyArray<string>) => void;
  validateItem?: (item: string) => boolean;
  badgeClassName?: string;
  invalidBadgeClassName?: string;
};

const SEPARATOR = ' ';

const TagInput = forwardRef<HTMLInputElement, TagInputProps>((props, ref) => {
  const {
    className,
    value = [],
    onChange,
    validateItem,
    badgeClassName,
    invalidBadgeClassName,
    ...domProps
  } = props;

  const [pendingDataPoint, setPendingDataPoint] = useState('');

  useEffect(() => {
    if (pendingDataPoint.includes(SEPARATOR)) {
      const newDataPoints = new Set(
        [...value, ...pendingDataPoint.split(SEPARATOR)].flatMap((x) => {
          const trimmedX = x.trim();
          return trimmedX.length > 0 ? [trimmedX] : [];
        }),
      );
      onChange(Array.from(newDataPoints));
      setPendingDataPoint('');
    }
  }, [pendingDataPoint, onChange, value]);

  const addPendingDataPoint = () => {
    if (pendingDataPoint) {
      const newDataPoints = new Set(
        [...value, ...pendingDataPoint.split(SEPARATOR)].flatMap((x) => {
          const trimmedX = x.trim();
          return trimmedX.length > 0 ? [trimmedX] : [];
        }),
      );
      onChange(Array.from(newDataPoints));
      setPendingDataPoint('');
    }
  };

  return (
    <div
      className={cn(
        // caveat: :has() variant requires tailwind v3.4 or above: https://tailwindcss.com/blog/tailwindcss-v3-4#new-has-variant
        'has-focus-visible:ring-neutral-950 dark:has-focus-visible:ring-neutral-300 border-neutral-200 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 flex min-h-10 w-full flex-wrap gap-2 rounded-md border bg-white px-3 py-2 text-sm ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 has-focus-visible:outline-hidden has-focus-visible:ring-2 has-focus-visible:ring-offset-2',
        className,
      )}
    >
      {value.map((item) => {
        const isValid = validateItem ? validateItem(item) : true;
        return (
          <Badge
            key={item}
            variant={'accent'}
            className={cn(
              'font-medium',
              badgeClassName,
              !isValid && invalidBadgeClassName,
            )}
          >
            <span className="text-xs">{item}</span>
            <Button
              variant={'ghost'}
              size={'icon'}
              className={'ml-2 h-3 w-3'}
              onClick={() => {
                onChange(value.filter((i) => i !== item));
              }}
            >
              <XIcon className={'w-3'} />
            </Button>
          </Badge>
        );
      })}
      <input
        className={
          'placeholder:text-neutral-500 dark:placeholder:text-neutral-400 w-full min-w-0 flex-1 outline-hidden'
        }
        value={pendingDataPoint}
        onChange={(e) => setPendingDataPoint(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === SEPARATOR) {
            e.preventDefault();
            addPendingDataPoint();
          } else if (
            e.key === 'Backspace' &&
            pendingDataPoint.length === 0 &&
            value.length > 0
          ) {
            e.preventDefault();
            onChange(value.slice(0, -1));
          }
        }}
        {...domProps}
        placeholder={value.length > 0 ? '' : domProps.placeholder}
        ref={ref}
      />
    </div>
  );
});

TagInput.displayName = 'TagInput';

export { TagInput };
