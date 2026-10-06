import {
  ArrowLeft01Icon,
  ArrowRight02Icon,
  Cancel01Icon,
  PencilEdit01Icon,
} from '@hugeicons/core-free-icons';
import { t } from 'i18next';
import { motion } from 'motion/react';
import { forwardRef, KeyboardEvent, ReactNode, Ref } from 'react';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { AnswerPair } from '../lib/message-parsers';

export function AnsweredQuestionsCard({ pairs }: AnsweredQuestionsCardProps) {
  if (pairs.length === 0) return null;

  return (
    <motion.div
      className="flex justify-end my-2"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="max-w-[80%] bg-gray-3 rounded-2xl rounded-br-md px-4 py-3 space-y-3">
        {pairs.map((pair, i) => (
          <div key={i} className="space-y-0.5">
            <p className="text-sm font-semibold">
              {t('Q{number}. {question}', {
                number: i + 1,
                question: pair.question,
              })}
            </p>
            <p className="text-sm">
              {t('→ {answer}', { answer: pair.answer })}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export function ChatCardSkeleton({ rows = 3 }: ChatCardSkeletonProps) {
  return (
    <ChatCard>
      <Skeleton className="h-5 w-2/3" />
      <div className="mt-4 space-y-0.5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2">
            <Skeleton className="size-7 shrink-0 rounded-md" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    </ChatCard>
  );
}

export function ChatCard({ children, className }: ChatCardProps) {
  return (
    <motion.div
      className={cn(
        'rounded-2xl border border-gray-6/60 bg-panel p-4 shadow-lg backdrop-blur-sm transition-colors',
        className,
      )}
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function ChatCardHeader({
  title,
  onBack,
  onClose,
  actions,
}: ChatCardHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      {onBack ? (
        <div className="flex flex-1 min-w-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-gray-11"
            onClick={onBack}
            aria-label={t('Back')}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
          </Button>
          <div className="flex-1 min-w-0">{title}</div>
        </div>
      ) : (
        <div className="flex-1 min-w-0">{title}</div>
      )}

      <div className="flex items-center gap-0.5 text-gray-11 shrink-0">
        {actions}
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="ms-1 h-7 w-7"
            onClick={onClose}
            aria-label={t('Close')}
          >
            <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function ChatOptionBadge({
  active,
  className,
  children,
}: ChatOptionBadgeProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded-md bg-gray-5 text-xs font-medium text-gray-11 transition-colors',
        active && 'bg-gray-12 text-gray-1',
        className,
      )}
    >
      {children}
    </span>
  );
}

export const ChatOptionRow = forwardRef<HTMLDivElement, ChatOptionRowProps>(
  function ChatOptionRow(
    {
      children,
      role = 'menuitemradio',
      selected,
      focused,
      tabIndex,
      onClick,
      onMouseEnter,
      onMouseLeave,
      onFocus,
      onBlur,
      onKeyDown,
      ariaLabel,
    },
    ref,
  ) {
    return (
      <div
        role={role}
        aria-checked={role === 'menuitemradio' ? selected : undefined}
        aria-label={ariaLabel}
        tabIndex={tabIndex}
        ref={ref}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        className={cn(
          'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-normal cursor-pointer transition-colors hover:bg-gray-3 outline-none',
          focused && !selected && 'bg-gray-3 hover:bg-gray-4',
          selected && 'bg-gray-4 hover:bg-gray-5',
        )}
      >
        {children}
      </div>
    );
  },
);

export function ChatAnswerInputRow({
  fieldId,
  value,
  placeholder,
  onChange,
  onSubmit,
  onSkip,
  onFocus,
  onMouseEnter,
  onMouseLeave,
  onRowFocus,
  onRowBlur,
  onArrowUp,
  onArrowDown,
  inputRef,
}: ChatAnswerInputRowProps) {
  const active = value.trim().length > 0;
  return (
    <label
      htmlFor={fieldId}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onRowFocus}
      onBlur={onRowBlur}
      className={cn(
        'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-normal cursor-text transition-colors hover:bg-gray-3 focus-within:bg-gray-3',
        active && 'bg-gray-3 hover:bg-gray-4',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-md bg-gray-5 text-gray-12 transition-colors group-focus-within:bg-gray-12 group-focus-within:text-gray-1',
          active && 'bg-gray-12 text-gray-1',
        )}
      >
        <HugeiconsIcon icon={PencilEdit01Icon} className="size-3.5" />
      </span>
      <Input
        ref={inputRef}
        id={fieldId}
        className="h-auto flex-1 min-w-0 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:border-0 dark:bg-transparent"
        placeholder={placeholder}
        value={value}
        onFocus={onFocus}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp' && onArrowUp) {
            e.preventDefault();
            onArrowUp();
            return;
          }
          if (e.key === 'ArrowDown' && onArrowDown) {
            e.preventDefault();
            onArrowDown();
            return;
          }
          if (e.key === 'Enter' && active) {
            e.preventDefault();
            onSubmit();
          }
        }}
      />
      <Button
        type="button"
        variant={active ? 'default' : 'outline'}
        size={active ? 'icon' : 'sm'}
        className={cn('h-7 shrink-0', active ? 'w-7' : 'px-2.5 text-sm')}
        onClick={() => (active ? onSubmit() : onSkip())}
        aria-label={active ? t('Send') : t('Skip')}
      >
        {active ? (
          <HugeiconsIcon icon={ArrowRight02Icon} className="size-4" />
        ) : (
          t('Skip')
        )}
      </Button>
    </label>
  );
}

type AnsweredQuestionsCardProps = {
  pairs: AnswerPair[];
};

type ChatCardSkeletonProps = {
  rows?: number;
};

type ChatCardProps = {
  children: ReactNode;
  className?: string;
};

type ChatCardHeaderProps = {
  title: ReactNode;
  onBack?: () => void;
  onClose?: () => void;
  actions?: ReactNode;
};

type ChatOptionBadgeProps = {
  active?: boolean;
  className?: string;
  children: ReactNode;
};

type ChatOptionRowProps = {
  children: ReactNode;
  role?: 'menuitemradio' | 'menuitem' | 'button';
  selected?: boolean;
  focused?: boolean;
  tabIndex?: number;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void;
  ariaLabel?: string;
};

type ChatAnswerInputRowProps = {
  fieldId: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onSkip: () => void;
  onFocus?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onRowFocus?: () => void;
  onRowBlur?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  inputRef?: Ref<HTMLInputElement>;
};
