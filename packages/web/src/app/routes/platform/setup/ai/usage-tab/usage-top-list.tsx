import { isNil } from '@activepieces/core-utils';
import { t } from 'i18next';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { adminSurface } from '@/app/components/admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { dimensionIcon, ItemIcon } from './usage-bits';
import { UsageDimension, UsageItem } from './usage-dummy-data';
import { usageFormat } from './usage-format';

export function UsageTopList({
  dimension,
  items,
  totalUsd,
  search,
  title,
  subtitle,
  showShared = false,
  shareOf,
  className,
}: UsageTopListProps) {
  const TitleIcon = dimensionIcon({ dimension });
  return (
    <section
      className={cn(adminSurface.card, 'flex flex-col gap-3 p-5', className)}
    >
      {items.length > 0 && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <h2 className="flex items-center gap-2 text-base font-semibold text-gray-12">
              <TitleIcon className="size-4 shrink-0 text-gray-11" />
              {title ?? usageFormat.dimensionLabel({ dimension })}
            </h2>
            {subtitle && <p className="text-xs text-gray-11">{subtitle}</p>}
          </div>
          <Button variant="ghost" size="xs" asChild>
            <Link to={`/platform/ai/usage/${dimension}${search}`}>
              {t('See all')}
              <ChevronRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      )}
      {items.length === 0 ? (
        <div className="flex min-h-36 flex-1 flex-col items-center justify-center gap-2 text-center">
          <span className="flex size-9 items-center justify-center rounded-lg bg-gray-3 text-gray-11">
            <TitleIcon className="size-4" />
          </span>
          <p className="text-sm font-medium text-gray-12">
            {t('No usage from {items}', {
              items: (
                title ?? usageFormat.dimensionLabel({ dimension })
              ).toLowerCase(),
            })}
          </p>
          <p className="max-w-56 text-xs text-gray-11">
            {t('Nothing ran in this period. Try a longer period or All.')}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {items.map((item) => (
            <UsageTopRow
              key={item.id}
              item={item}
              totalUsd={totalUsd}
              search={search}
              showShared={showShared}
              shareOf={shareOf}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

export function UsageTopRow({
  item,
  totalUsd,
  search,
  showShared = false,
  shareOf,
}: {
  item: UsageItem;
  totalUsd: number;
  search: string;
  showShared?: boolean;
  shareOf?: string;
}) {
  const share = totalUsd === 0 ? 0 : item.spendUsd / totalUsd;
  return (
    <li>
      <Tooltip delayDuration={ROW_TOOLTIP_DELAY_MS}>
        <TooltipTrigger asChild>
          <Link
            to={`/platform/ai/usage/${item.dimension}/${item.id}${search}`}
            className="group relative flex min-w-0 items-center gap-2.5 overflow-hidden rounded-md px-3 py-2 transition-colors hover:bg-gray-2 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-gray-8/50"
          >
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 rounded-md bg-accent-3 transition-colors group-hover:bg-accent-4"
              style={{ width: `${Math.max(share * 100, 1)}%` }}
            />
            {(item.dimension === 'key' || item.dimension === 'model') && (
              <span className="relative">
                <ItemIcon item={item} />
              </span>
            )}
            <div className="relative flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium text-gray-12">
                {item.name}
              </span>
              {(item.parent || (showShared && !isNil(item.sharedWith))) && (
                <span className="flex min-w-0 items-center gap-1.5">
                  {item.parent && (
                    <span className="truncate text-xs text-gray-11">
                      {item.parent}
                    </span>
                  )}
                  {showShared && !isNil(item.sharedWith) && (
                    <SharedBadge item={item} />
                  )}
                </span>
              )}
            </div>
            <span className="relative shrink-0 text-sm font-medium tabular-nums text-gray-12">
              {usageFormat.usd(item.spendUsd)}
            </span>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={6}>
          {shareOf
            ? t('{share} of {whole}', {
                share: usageFormat.percent(share),
                whole: shareOf,
              })
            : t('{share} of all AI spend in this period', {
                share: usageFormat.percent(share),
              })}
        </TooltipContent>
      </Tooltip>
    </li>
  );
}

function SharedBadge({ item }: { item: UsageItem }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="info">{t('Shared')}</Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        {t(
          '{amount} of this comes from Run Agent steps, so it also counts under {other}.',
          {
            amount: usageFormat.usd(item.spendUsd * (item.sharedShare ?? 0)),
            other: item.sharedWith ?? '',
          },
        )}
      </TooltipContent>
    </Tooltip>
  );
}

const ROW_TOOLTIP_DELAY_MS = 500;

type UsageTopListProps = {
  dimension: UsageDimension;
  items: UsageItem[];
  totalUsd: number;
  search: string;
  title?: string;
  subtitle?: string;
  showShared?: boolean;
  shareOf?: string;
  className?: string;
};
