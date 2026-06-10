'use client';

import { t } from 'i18next';
import { XIcon } from 'lucide-react';
import { forwardRef, useCallback, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { InputProps } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

type TagInputProps = Omit<InputProps, 'value' | 'onChange'> & {
  value?: ReadonlyArray<string>;
  onChange: (value: ReadonlyArray<string>) => void;
  validateItem?: (item: string) => boolean;
  badgeClassName?: string;
  invalidBadgeClassName?: string;
  getTagMeta?: (item: string) => TagMeta | undefined;
  rightContent?: React.ReactNode;
  type?: 'default' | 'email';
  showDescription?: boolean;
  onInputChange?: (value: string) => void;
};

const SEPARATOR = ' ';
const SPLIT_PATTERN = /[, ]/;

const TagInput = forwardRef<HTMLInputElement, TagInputProps>((props, ref) => {
  const {
    className,
    value = [],
    onChange,
    validateItem,
    badgeClassName,
    invalidBadgeClassName,
    getTagMeta,
    rightContent,
    type = 'default',
    showDescription = true,
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
      ? 'text-destructive-800 bg-destructive-50 border-destructive-200 dark:text-destructive-200 dark:bg-destructive-900 dark:border-destructive-800'
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

  const commitWithSeparator = useCallback(
    (input: string) => {
      const newDataPoints = new Set(
        [...value, ...input.split(SPLIT_PATTERN)].flatMap((x) => {
          const trimmedX = x.trim();
          return trimmedX.length > 0 ? [trimmedX] : [];
        }),
      );
      onChange(Array.from(newDataPoints));
      setPendingDataPoint('');
      onInputChange?.('');
    },
    [value, onChange, onInputChange],
  );

  const addPendingDataPoint = useCallback(() => {
    setPendingDataPoint((current) => {
      if (current) {
        const newDataPoints = new Set(
          [...value, ...current.split(SPLIT_PATTERN)].flatMap((x) => {
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

  return (
    <div className="w-full">
      <div className="relative w-full">
        <div
          className={cn(
            // caveat: :has() variant requires tailwind v3.4 or above: https://tailwindcss.com/blog/tailwindcss-v3-4#new-has-variant
            'has-focus-visible:ring-neutral-950 dark:has-focus-visible:ring-neutral-300 border-neutral-200 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 flex min-h-9 w-full rounded-md border bg-white ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 has-focus-visible:outline-hidden has-focus-visible:ring-2 has-focus-visible:ring-offset-2 cursor-text',
            className,
          )}
          onClick={() => internalInputRef.current?.focus()}
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
                const tagMeta = getTagMeta?.(item);
                const badge = (
                  <Badge
                    key={item}
                    variant={'accent'}
                    className={cn(
                      'font-medium max-w-full cursor-default',
                      effectiveBadgeClassName,
                      !isValid && effectiveInvalidBadgeClassName,
                      tagMeta?.className,
                    )}
                  >
                    {tagMeta?.icon}
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
                      className={'ml-2 h-3 w-3 shrink-0 hover:bg-transparent'}
                      onClick={() => {
                        onChange(value.filter((i) => i !== item));
                      }}
                    >
                      <XIcon className={'w-3'} />
                    </Button>
                  </Badge>
                );
                if (tagMeta?.tooltip) {
                  return (
                    <Tooltip key={item}>
                      <TooltipTrigger asChild>{badge}</TooltipTrigger>
                      <TooltipContent side="bottom">
                        {tagMeta.tooltip}
                      </TooltipContent>
                    </Tooltip>
                  );
                }
                return badge;
              })}
              <input
                className={
                  'placeholder:text-neutral-500 dark:placeholder:text-neutral-400 w-full min-w-[200px] flex-1 outline-hidden bg-transparent'
                }
                autoComplete="off"
                value={pendingDataPoint}
                onChange={(e) => {
                  const newValue = e.target.value;
                  if (SPLIT_PATTERN.test(newValue)) {
                    commitWithSeparator(newValue);
                  } else {
                    setPendingDataPoint(newValue);
                    onInputChange?.(newValue);
                  }
                }}
                {...domProps}
                onKeyDown={(e) => {
                  domProps.onKeyDown?.(e);
                  if (e.defaultPrevented) return;
                  if (
                    e.key === 'Enter' ||
                    e.key === SEPARATOR ||
                    e.key === ','
                  ) {
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
                onBlur={(e) => {
                  addPendingDataPoint();
                  domProps.onBlur?.(e);
                }}
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
      {type === 'email' && showDescription && (
        <p className="text-xs text-muted-foreground mt-2">
          {t('Separate email addresses with a space or comma.')}
        </p>
      )}
    </div>
  );
});

TagInput.displayName = 'TagInput';

export { TagInput };

type TagMeta = {
  className?: string;
  icon?: React.ReactNode;
  tooltip?: string;
};

export type { TagMeta };
