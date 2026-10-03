import { t } from 'i18next';
import * as React from 'react';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { listFormat } from './list-format';

function NameCell({
  media,
  title,
  sub,
  stacked = false,
  className,
}: {
  media?: React.ReactNode;
  title: React.ReactNode;
  sub?: React.ReactNode;
  stacked?: boolean;
  className?: string;
}) {
  const titleText = typeof title === 'string' ? title : undefined;
  return (
    <div className={cn('flex min-w-0 items-center gap-2.5', className)}>
      {media}
      <div
        className={cn(
          'flex min-w-0',
          stacked ? 'flex-col' : 'items-baseline gap-2'
        )}
      >
        <TextWithTooltip tooltipMessage={titleText ?? ''}>
          <span className="block max-w-full min-w-0 shrink-0 truncate font-medium text-gray-12">
            {title}
          </span>
        </TextWithTooltip>
        {sub !== undefined && sub !== null && sub !== '' && (
          <span className="min-w-0 truncate text-xs text-gray-11">{sub}</span>
        )}
      </div>
    </div>
  );
}

function InitialsTile({
  name,
  className,
  style,
}: {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      aria-hidden
      style={style}
      className={cn(
        'flex size-6 shrink-0 items-center justify-center rounded-md bg-gray-3 text-xs font-medium text-gray-11',
        className
      )}
    >
      {listFormat.initialsOf(name)}
    </span>
  );
}

function PersonCell({
  name,
  email,
  sub,
  className,
}: {
  name: string | null | undefined;
  email?: string | null;
  sub?: React.ReactNode;
  className?: string;
}) {
  const label = name && name.trim().length > 0 ? name : email ?? t('Unknown');
  return (
    <NameCell
      className={className}
      media={<InitialsTile name={label} className="rounded-full" />}
      title={label}
      sub={sub ?? (email && email !== label ? email : undefined)}
    />
  );
}

function MutedCell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const empty =
    children === null ||
    children === undefined ||
    (typeof children === 'string' && children.trim() === '');
  return (
    <span className={cn('block truncate text-gray-11', className)}>
      {empty ? EMPTY_VALUE : children}
    </span>
  );
}

function NumberCell({
  value,
  children,
  className,
}: {
  value?: number | null;
  children?: React.ReactNode;
  className?: string;
}) {
  const content =
    children ??
    (value === null || value === undefined
      ? EMPTY_VALUE
      : listFormat.count(value));
  return (
    <span
      className={cn(
        'block text-right whitespace-nowrap text-gray-11 tabular-nums',
        className
      )}
    >
      {content}
    </span>
  );
}

function DateCell({
  value,
  mode = 'relative',
  emptyLabel,
  className,
}: {
  value: string | Date | null | undefined;
  mode?: 'relative' | 'short';
  emptyLabel?: string;
  className?: string;
}) {
  if (value === null || value === undefined) {
    return (
      <span className={cn('block whitespace-nowrap text-gray-11', className)}>
        {emptyLabel ?? (mode === 'relative' ? t('Never') : EMPTY_VALUE)}
      </span>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'block w-fit whitespace-nowrap text-gray-11 tabular-nums',
            className
          )}
        >
          {mode === 'relative'
            ? listFormat.relativeDate(value)
            : listFormat.shortDate(value)}
        </span>
      </TooltipTrigger>
      <TooltipContent>{listFormat.dateTime(value)}</TooltipContent>
    </Tooltip>
  );
}

function TagsCell({
  tags,
  max = 2,
  className,
}: {
  tags: string[];
  max?: number;
  className?: string;
}) {
  if (tags.length === 0) {
    return <MutedCell>{EMPTY_VALUE}</MutedCell>;
  }
  const shown = tags.slice(0, max);
  const rest = tags.slice(max);
  return (
    <div className={cn('flex min-w-0 items-center gap-1', className)}>
      {shown.map((tag) => (
        <Badge key={tag} variant="outline" className="max-w-40 truncate">
          {tag}
        </Badge>
      ))}
      {rest.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-xs text-gray-11 tabular-nums">
              +{rest.length}
            </span>
          </TooltipTrigger>
          <TooltipContent>{rest.join(', ')}</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

const EMPTY_VALUE = '—';

export {
  NameCell,
  InitialsTile,
  PersonCell,
  MutedCell,
  NumberCell,
  DateCell,
  TagsCell,
  EMPTY_VALUE,
};
