'use client';

import { t } from 'i18next';
import { XIcon } from 'lucide-react';
import { forwardRef, useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

import { Badge } from './badge';
import { Button } from './button';
import type { InputProps } from './input';
import { ReadMoreDescription } from './read-more-description';

type TagInputProps = Omit<InputProps, 'value' | 'onChange'> & {
  value?: ReadonlyArray<string>;
  onChange: (value: ReadonlyArray<string>) => void;
};

const SEPARATOR = ' ';

const TagInput = forwardRef<HTMLInputElement, TagInputProps>((props, ref) => {
  const { className, value = [], onChange, ...domProps } = props;

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
    <>
      <div
        className={cn(
          // caveat: :has() variant requires tailwind v3.4 or above: https://tailwindcss.com/blog/tailwindcss-v3-4#new-has-variant
          'has-[:focus-visible]:ring-neutral-950 dark:has-[:focus-visible]:ring-neutral-300 border-neutral-200 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 flex min-h-10 w-full flex-wrap gap-2 rounded-md border bg-white px-3 py-2 text-sm ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 has-[:focus-visible]:outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-offset-2',
          className,
        )}
      >
        {value.map((item) => (
          <Badge key={item} variant={'accent'}>
            <span className="text-xs font-medium">{item}</span>
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
        ))}
        <input
          className={
            'placeholder:text-neutral-500 dark:placeholder:text-neutral-400 flex-1 outline-none'
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
          ref={ref}
        />
      </div>
      <div className="mt-3">
        <ReadMoreDescription
          text={t('Press space to separate values')}
        ></ReadMoreDescription>
      </div>
    </>
  );
});

TagInput.displayName = 'TagInput';

export { TagInput };
