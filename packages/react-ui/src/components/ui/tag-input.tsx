'use client';

import { XIcon } from 'lucide-react';
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';

import { cn, formatUtils } from '@/lib/utils';

import { Badge } from './badge';
import { Button } from './button';
import type { InputProps } from './input';
import { ScrollArea } from './scroll-area';

type TagInputProps = Omit<InputProps, 'value' | 'onChange'> & {
  value?: ReadonlyArray<string>;
  onChange: (value: ReadonlyArray<string>) => void;
  validateItem?: (item: string) => boolean;
  badgeClassName?: string;
  invalidBadgeClassName?: string;
  rightContent?: React.ReactNode;
  type?: 'default' | 'email';
  onInputChange?: (value: string) => void;
};

const SEPARATOR = ',';

const TagInput = forwardRef<HTMLInputElement, TagInputProps>((props, ref) => {
  const {
    className,
    value = [],
    onChange,
    validateItem,
    badgeClassName,
    invalidBadgeClassName,
    rightContent,
    type = 'default',
    onInputChange,
    ...domProps
  } = props;

  const effectiveValidateItem =
    validateItem ||
    (type === 'email'
      ? (email: string) => formatUtils.emailRegex.test(email.trim())
      : undefined);

  const effectiveBadgeClassName =
    badgeClassName ||
    (type === 'email'
      ? 'rounded-sm border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 font-normal'
      : undefined);

  const effectiveInvalidBadgeClassName =
    invalidBadgeClassName ||
    (type === 'email'
      ? 'bg-destructive border-destructive text-white font-light'
      : undefined);

  const [pendingDataPoint, setPendingDataPoint] = useState('');
  const internalInputRef = useRef<HTMLInputElement | null>(null);

  const handleRef = useCallback(
    (node: HTMLInputElement | null) => {
      internalInputRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
      }
    },
    [ref],
  );

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
      onInputChange?.('');
    }
  }, [pendingDataPoint, onChange, value, onInputChange]);

  const addPendingDataPoint = useCallback(() => {
    setPendingDataPoint((current) => {
      if (current) {
        const newDataPoints = new Set(
          [...value, ...current.split(SEPARATOR)].flatMap((x) => {
            const trimmedX = x.trim();
            return trimmedX.length > 0 ? [trimmedX] : [];
          }),
        );
        onChange(Array.from(newDataPoints));
        onInputChange?.('');
        return '';
      }
      return current;
    });
  }, [onChange, value, onInputChange]);

  useEffect(() => {
    const input = internalInputRef.current;
    if (!input) return;

    const form = input.closest('form');
    if (!form) return;

    const handleFormSubmit = () => {
      addPendingDataPoint();
    };

    form.addEventListener('submit', handleFormSubmit, true);

    return () => {
      form.removeEventListener('submit', handleFormSubmit, true);
    };
  }, [addPendingDataPoint]);

  return (
    <div className="w-full">
      <div className="relative w-full">
        <div
          className={cn(
            // caveat: :has() variant requires tailwind v3.4 or above: https://tailwindcss.com/blog/tailwindcss-v3-4#new-has-variant
            'has-focus-visible:ring-neutral-950 dark:has-focus-visible:ring-neutral-300 border-neutral-200 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 flex min-h-10 w-full rounded-md border bg-white ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 has-focus-visible:outline-hidden has-focus-visible:ring-2 has-focus-visible:ring-offset-2',
            className,
          )}
        >
          <ScrollArea className="w-full max-h-32" viewPortClassName="px-3 py-2">
            <div
              className={cn(
                'flex flex-wrap gap-2 text-sm',
                rightContent && 'pr-[140px]',
              )}
            >
              {value.map((item) => {
                const isValid = effectiveValidateItem
                  ? effectiveValidateItem(item)
                  : true;
                return (
                  <Badge
                    key={item}
                    variant={'accent'}
                    className={cn(
                      'font-medium max-w-full',
                      effectiveBadgeClassName,
                      !isValid && effectiveInvalidBadgeClassName,
                    )}
                  >
                    <span
                      className={cn(
                        'text-xs overflow-hidden text-ellipsis whitespace-nowrap min-w-0',
                        type === 'email' && 'max-w-[25ch]',
                      )}
                    >
                      {item}
                    </span>
                    <Button
                      variant={'ghost'}
                      size={'icon'}
                      className={'ml-2 h-3 w-3 shrink-0'}
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
                  'placeholder:text-neutral-500 dark:placeholder:text-neutral-400 w-full min-w-[200px] flex-1 outline-hidden bg-transparent'
                }
                autoComplete="off"
                value={pendingDataPoint}
                onChange={(e) => {
                  setPendingDataPoint(e.target.value);
                  onInputChange?.(e.target.value);
                }}
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
                onBlur={() => {
                  addPendingDataPoint();
                }}
                {...domProps}
                placeholder={value.length > 0 ? '' : domProps.placeholder}
                ref={handleRef}
              />
            </div>
          </ScrollArea>
        </div>
        {rightContent && (
          <div className="absolute right-2 top-2 pointer-events-auto">
            {rightContent}
          </div>
        )}
      </div>
      {type === 'email' && (
        <p className="text-xs text-muted-foreground mt-2">
          Separate email addresses with a comma.
        </p>
      )}
    </div>
  );
});

TagInput.displayName = 'TagInput';

export { TagInput };
