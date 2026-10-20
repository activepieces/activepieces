import { isNil } from '@activepieces/core-utils';
import { t } from 'i18next';
import { ChevronRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

import { adminSurface } from '@/app/components/admin';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { DeltaChip, ItemIcon } from './usage-bits';
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
  className,
}: UsageTopListProps) {
  return (
    <section
      className={cn(adminSurface.card, 'flex flex-col gap-3 p-5', className)}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold text-gray-12">
            {title ?? usageFormat.dimensionLabel({ dimension })}
          </h2>
          {subtitle && <p className="text-xs text-gray-11">{subtitle}</p>}
        </div>
        {items.length > 0 && (
          <Button variant="ghost" size="xs" asChild>
            <Link to={`/platform/ai/usage/${dimension}${search}`}>
              {t('See all')}
              <ChevronRight className="size-3.5" />
            </Link>
          </Button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-gray-11">
          {t('No AI usage in this period.')}
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <UsageTopRow
              key={item.id}
              item={item}
              totalUsd={totalUsd}
              search={search}
              showShared={showShared}
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
}: {
  item: UsageItem;
  totalUsd: number;
  search: string;
  showShared?: boolean;
}) {
  const share = totalUsd === 0 ? 0 : item.spendUsd / totalUsd;
  return (
    <li className="flex items-center gap-2">
      <Link
        to={`/platform/ai/usage/${item.dimension}/${item.id}${search}`}
        className="flex min-w-0 flex-1 flex-col gap-1.5 rounded-md py-1.5 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-gray-8/50"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <ItemIcon item={item} />
          <div className="flex min-w-0 flex-1 flex-col">
            <TextWithTooltip tooltipMessage={item.name}>
              <p className="truncate text-sm font-medium text-gray-12">
                {item.name}
              </p>
            </TextWithTooltip>
            <div className="flex min-w-0 items-center gap-1.5">
              {item.parent && (
                <p className="truncate text-xs text-gray-11">{item.parent}</p>
              )}
              {showShared && !isNil(item.sharedWith) && (
                <SharedBadge item={item} />
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end">
            <span className="text-sm font-medium tabular-nums text-gray-12">
              {usageFormat.usd(item.spendUsd)}
            </span>
            {item.comparable && (
              <DeltaChip
                size="xs"
                value={usageFormat.change({
                  current: item.spendUsd,
                  previous: item.previousSpendUsd,
                })}
              />
            )}
          </div>
          <ChevronRight className="size-4 shrink-0 text-gray-9" />
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-gray-3">
          <div
            className="h-full rounded-full bg-accent-9"
            style={{ width: `${Math.max(share * 100, 1)}%` }}
          />
        </div>
      </Link>
      {item.dimension === 'key' &&
        !isNil(item.dashboardUrl) &&
        !item.dashboardUrl.startsWith('/') && (
          <Button variant="ghost" size="icon-sm" asChild>
            <a
              href={item.dashboardUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={t('Open provider dashboard')}
            >
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
        )}
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

type UsageTopListProps = {
  dimension: UsageDimension;
  items: UsageItem[];
  totalUsd: number;
  search: string;
  title?: string;
  subtitle?: string;
  showShared?: boolean;
  className?: string;
};
