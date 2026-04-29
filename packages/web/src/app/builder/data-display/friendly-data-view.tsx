import { isObject } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronRight, FileX2 } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils';

const LONG_STRING_THRESHOLD = 140;
const TOP_LEVEL_DEFAULT_EXPANDED_DEPTH = 0;

type FriendlyDataViewProps = {
  data: unknown;
  emptyMessage?: string;
  className?: string;
};

const FriendlyDataView = ({
  data,
  emptyMessage,
  className,
}: FriendlyDataViewProps) => {
  if (data === undefined || data === null) {
    return (
      <FriendlyEmptyState message={emptyMessage ?? t('No data to show')} />
    );
  }
  if (typeof data !== 'object') {
    return (
      <div className={cn('rounded-md border border-border', className)}>
        <FriendlyPrimitiveBlock value={data} />
      </div>
    );
  }
  const entries = Array.isArray(data)
    ? data.map((value, idx) => [String(idx), value] as const)
    : Object.entries(data as Record<string, unknown>);

  if (entries.length === 0) {
    return (
      <FriendlyEmptyState message={emptyMessage ?? t('No data to show')} />
    );
  }

  return (
    <div
      className={cn(
        'rounded-md border border-border divide-y divide-border',
        className,
      )}
    >
      {entries.map(([key, value]) => (
        <FriendlyRow key={key} label={key} value={value} depth={0} />
      ))}
    </div>
  );
};

type FriendlyRowProps = {
  label: string;
  value: unknown;
  depth: number;
};

const FriendlyRow = ({ label, value, depth }: FriendlyRowProps) => {
  const isArr = Array.isArray(value);
  const isObj = isObject(value) && !isArr;
  const hasChildren =
    (isObj && Object.keys(value as object).length > 0) ||
    (isArr && (value as unknown[]).length > 0);

  if (!hasChildren) {
    return (
      <div
        className="flex items-start gap-3 py-2.5 px-3 text-sm min-w-0"
        style={{ paddingLeft: depth * 16 + 32 }}
      >
        <span className="text-muted-foreground shrink-0 min-w-[88px] max-w-[160px] truncate">
          {label}
        </span>
        <FriendlyValue value={value} className="flex-1 min-w-0" />
      </div>
    );
  }

  return (
    <FriendlyExpandableRow
      label={label}
      value={value}
      depth={depth}
      isArray={isArr}
    />
  );
};

type FriendlyExpandableRowProps = {
  label: string;
  value: unknown;
  depth: number;
  isArray: boolean;
};

const FriendlyExpandableRow = ({
  label,
  value,
  depth,
  isArray,
}: FriendlyExpandableRowProps) => {
  const [expanded, setExpanded] = useState(
    depth <= TOP_LEVEL_DEFAULT_EXPANDED_DEPTH,
  );
  const childEntries = isArray
    ? (value as unknown[]).map((v, i) => [String(i), v] as const)
    : Object.entries(value as Record<string, unknown>);

  return (
    <div className="min-w-0">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 w-full text-left py-2.5 px-3 text-sm hover:bg-muted/50 transition-colors"
        style={{ paddingLeft: depth * 16 + 8 }}
        aria-expanded={expanded}
      >
        <ChevronRight
          className={cn(
            'size-4 shrink-0 text-muted-foreground transition-transform',
            expanded && 'rotate-90',
          )}
        />
        <span className="font-medium text-foreground truncate">{label}</span>
        {isArray && (
          <span className="text-muted-foreground text-xs ml-2">
            {t('{count, plural, =1 {1 item} other {# items}}', {
              count: childEntries.length,
            })}
          </span>
        )}
      </button>
      {expanded && (
        <div className="border-t border-border divide-y divide-border bg-muted/20">
          {childEntries.map(([k, v]) => (
            <FriendlyRow key={k} label={k} value={v} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

type FriendlyValueProps = {
  value: unknown;
  className?: string;
};

const FriendlyValue = ({ value, className }: FriendlyValueProps) => {
  if (value === null || value === undefined) {
    return <span className={cn('text-muted-foreground', className)}>—</span>;
  }
  if (typeof value === 'boolean') {
    return (
      <span className={cn('text-foreground font-mono', className)}>
        {value ? 'true' : 'false'}
      </span>
    );
  }
  if (typeof value === 'number') {
    return (
      <span className={cn('text-foreground font-mono', className)}>
        {String(value)}
      </span>
    );
  }
  if (typeof value === 'string') {
    return <FriendlyStringValue value={value} className={className} />;
  }
  if (Array.isArray(value) && value.length === 0) {
    return (
      <span className={cn('text-muted-foreground italic', className)}>
        {t('Empty list')}
      </span>
    );
  }
  if (isObject(value) && Object.keys(value as object).length === 0) {
    return (
      <span className={cn('text-muted-foreground italic', className)}>
        {t('Empty object')}
      </span>
    );
  }
  return (
    <span className={cn('text-foreground font-mono break-all', className)}>
      {JSON.stringify(value)}
    </span>
  );
};

type FriendlyStringValueProps = {
  value: string;
  className?: string;
};

const FriendlyStringValue = ({
  value,
  className,
}: FriendlyStringValueProps) => {
  const [showFull, setShowFull] = useState(false);
  const isLong = value.length > LONG_STRING_THRESHOLD;
  const display =
    !isLong || showFull ? value : `${value.slice(0, LONG_STRING_THRESHOLD)}…`;
  const looksLikeLink = isEmailLike(value) || isUrlLike(value);

  return (
    <div className={cn('break-words', className)}>
      <span
        className={cn(
          'text-foreground whitespace-pre-wrap break-words',
          looksLikeLink && 'text-primary',
        )}
      >
        {display}
      </span>
      {isLong && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowFull(!showFull);
          }}
          className="ml-2 text-primary text-xs hover:underline"
        >
          {showFull ? t('Show less') : t('Show more')}
        </button>
      )}
    </div>
  );
};

type FriendlyPrimitiveBlockProps = {
  value: unknown;
};

const FriendlyPrimitiveBlock = ({ value }: FriendlyPrimitiveBlockProps) => {
  return (
    <div className="px-3 py-2.5 text-sm">
      <FriendlyValue value={value} />
    </div>
  );
};

type FriendlyEmptyStateProps = {
  message: string;
};

const FriendlyEmptyState = ({ message }: FriendlyEmptyStateProps) => {
  return (
    <div className="rounded-md border border-dashed border-border py-8 px-4 flex flex-col items-center justify-center gap-2 text-muted-foreground">
      <FileX2 className="size-6" />
      <span className="text-sm">{message}</span>
    </div>
  );
};

const isEmailLike = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const isUrlLike = (s: string) => /^https?:\/\//.test(s);

FriendlyDataView.displayName = 'FriendlyDataView';
export { FriendlyDataView };
