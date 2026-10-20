import { AIProviderName, isNil } from '@activepieces/core-utils';
import { t } from 'i18next';
import { Coins, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { adminSurface } from '@/app/components/admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SUPPORTED_AI_PROVIDERS } from '@/features/agents';
import { cn } from '@/lib/utils';

import { ProviderLogo } from '../providers-tab/provider-logo';

import {
  usageDummyData,
  UsageGroupBy,
  UsageRow,
  UsageTotals,
} from './usage-dummy-data';
import { usageFormat } from './usage-format';

export function UsageTable({
  rows,
  totals,
  groupBy,
  creditUsdValue,
}: UsageTableProps) {
  const [limits, setLimits] = useState<Record<string, number | null>>({});
  const [editing, setEditing] = useState<UsageRow | null>(null);
  const totalSpend =
    totals.exactUsd + totals.estimatedUsd + totals.credits * creditUsdValue;

  return (
    <div className={cn(adminSurface.listFrame, 'overflow-x-auto')}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-56">
              {usageFormat.groupLabel({ groupBy })}
            </TableHead>
            <TableHead className="text-right">{t('Calls')}</TableHead>
            <TableHead className="text-right">{t('Tokens')}</TableHead>
            <TableHead className="text-right">{t('Spend')}</TableHead>
            <TableHead className="min-w-32">{t('Share')}</TableHead>
            {groupBy === 'project' && (
              <TableHead className="min-w-48">{t('Monthly limit')}</TableHead>
            )}
            {groupBy === 'key' && <TableHead />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const share =
              totalSpend === 0
                ? 0
                : usageDummyData.spendUsdOf({ row }) / totalSpend;
            const limit =
              row.id in limits ? limits[row.id] : row.monthlyLimitUsd ?? null;
            return (
              <TableRow key={row.id}>
                <TableCell>
                  <NameCell row={row} groupBy={groupBy} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {usageFormat.whole(row.calls)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  <Tooltip>
                    <TooltipTrigger className="cursor-default">
                      {usageFormat.compact(row.inputTokens + row.outputTokens)}
                    </TooltipTrigger>
                    <TooltipContent>
                      {t('{input} in · {output} out · {cached} cached', {
                        input: usageFormat.compact(row.inputTokens),
                        output: usageFormat.compact(row.outputTokens),
                        cached: usageFormat.compact(row.cacheReadTokens),
                      })}
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell className="text-right">
                  <SpendCell row={row} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-4">
                      <div
                        className="h-full rounded-full bg-accent-9"
                        style={{ width: `${Math.max(share * 100, 1)}%` }}
                      />
                    </div>
                    <span className="w-9 text-right text-xs tabular-nums text-gray-11">
                      {usageFormat.percent(share)}
                    </span>
                  </div>
                </TableCell>
                {groupBy === 'project' && (
                  <TableCell>
                    <LimitCell
                      spentUsd={
                        row.monthToDateUsd ?? usageDummyData.spendUsdOf({ row })
                      }
                      limitUsd={limit}
                      onEdit={() => setEditing(row)}
                    />
                  </TableCell>
                )}
                {groupBy === 'key' && (
                  <TableCell className="text-right">
                    <DashboardLink row={row} />
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <SetLimitDialog
        row={editing}
        currentLimit={
          isNil(editing)
            ? null
            : editing.id in limits
            ? limits[editing.id]
            : editing.monthlyLimitUsd ?? null
        }
        onClose={() => setEditing(null)}
        onSave={(value) => {
          if (!isNil(editing)) {
            setLimits({ ...limits, [editing.id]: value });
          }
          setEditing(null);
        }}
      />
    </div>
  );
}

function NameCell({ row, groupBy }: { row: UsageRow; groupBy: UsageGroupBy }) {
  const info = SUPPORTED_AI_PROVIDERS.find(
    (provider) => provider.provider === row.provider,
  );
  const showLogo = groupBy === 'key' || groupBy === 'model';
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {showLogo &&
        (row.provider === AIProviderName.ACTIVEPIECES || isNil(info) ? (
          <span className="flex size-4 shrink-0 items-center justify-center text-gray-11">
            <Coins className="size-4" />
          </span>
        ) : (
          <ProviderLogo info={info} size="sm" />
        ))}
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium text-gray-12">{row.name}</span>
        {row.subtitle && (
          <span className="truncate text-xs text-gray-11">{row.subtitle}</span>
        )}
      </div>
      {row.unpricedCalls > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="warning">
              {t('{calls} unpriced', {
                calls: usageFormat.compact(row.unpricedCalls),
              })}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            {t(
              'These calls have no list price, so their cost is not counted. Set a custom price on the key.',
            )}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

function SpendCell({ row }: { row: UsageRow }) {
  const ownKeyUsd = row.exactUsd + row.estimatedUsd;
  const estimatedShare = ownKeyUsd === 0 ? 0 : row.estimatedUsd / ownKeyUsd;
  return (
    <div className="flex flex-col items-end gap-0.5">
      {ownKeyUsd > 0 && (
        <span className="flex items-center gap-1.5 font-medium tabular-nums text-gray-12">
          {estimatedShare >= ESTIMATED_BADGE_SHARE && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary">{t('Est.')}</Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                {t(
                  '{amount} is estimated from list prices. Your provider bill is the source of truth.',
                  { amount: usageFormat.usd(row.estimatedUsd) },
                )}
              </TooltipContent>
            </Tooltip>
          )}
          {usageFormat.usd(ownKeyUsd)}
        </span>
      )}
      {row.credits > 0 && (
        <span
          className={cn(
            'tabular-nums',
            ownKeyUsd > 0 ? 'text-xs text-gray-11' : 'font-medium text-gray-12',
          )}
        >
          {t('{credits} credits', { credits: usageFormat.whole(row.credits) })}
        </span>
      )}
      {ownKeyUsd === 0 && row.credits === 0 && (
        <span className="text-gray-11">—</span>
      )}
    </div>
  );
}

function LimitCell({
  spentUsd,
  limitUsd,
  onEdit,
}: {
  spentUsd: number;
  limitUsd: number | null;
  onEdit: () => void;
}) {
  if (isNil(limitUsd)) {
    return (
      <Button variant="outline" size="sm" onClick={onEdit}>
        {t('Set limit')}
      </Button>
    );
  }
  const used = spentUsd / limitUsd;
  return (
    <button
      type="button"
      onClick={onEdit}
      className="flex w-full flex-col gap-1 rounded-md text-left focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-gray-8/50"
    >
      <span
        className={cn(
          'text-xs tabular-nums',
          used >= 1
            ? 'font-medium text-danger-11'
            : used >= WARN_SHARE
            ? 'text-warning-11'
            : 'text-gray-11',
        )}
      >
        {used >= 1
          ? t('Limit reached · {spent} of {limit}', {
              spent: usageFormat.usd(spentUsd),
              limit: usageFormat.usd(limitUsd),
            })
          : t('{spent} of {limit}', {
              spent: usageFormat.usd(spentUsd),
              limit: usageFormat.usd(limitUsd),
            })}
      </span>
      <Progress
        value={Math.min(used * 100, 100)}
        className={cn(
          'h-1.5',
          used >= 1
            ? '*:bg-danger-9'
            : used >= WARN_SHARE
            ? '*:bg-warning-9'
            : '',
        )}
      />
    </button>
  );
}

function DashboardLink({ row }: { row: UsageRow }) {
  if (isNil(row.dashboardUrl)) {
    return null;
  }
  if (row.dashboardUrl.startsWith('/')) {
    return (
      <Button variant="ghost" size="sm" asChild>
        <Link to={row.dashboardUrl}>{t('Open billing')}</Link>
      </Button>
    );
  }
  return (
    <Button variant="ghost" size="sm" asChild>
      <a href={row.dashboardUrl} target="_blank" rel="noreferrer">
        {t('Open dashboard')}
        <ExternalLink className="size-3.5" />
      </a>
    </Button>
  );
}

function SetLimitDialog({
  row,
  currentLimit,
  onClose,
  onSave,
}: SetLimitDialogProps) {
  const [value, setValue] = useState('');
  return (
    <Dialog
      open={!isNil(row)}
      onOpenChange={(open) => {
        if (open) {
          return;
        }
        onClose();
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        onOpenAutoFocus={() =>
          setValue(isNil(currentLimit) ? '' : String(currentLimit))
        }
      >
        <DialogHeader>
          <DialogTitle>
            {t('Monthly AI limit for {project}', { project: row?.name ?? '' })}
          </DialogTitle>
          <DialogDescription>
            {t(
              'When this project reaches the limit, new AI calls stop until the next month or until you raise it. Calls already running finish.',
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="usage-limit">
            {t('Limit per calendar month (USD)')}
          </Label>
          <Input
            id="usage-limit"
            type="number"
            min={1}
            step={1}
            placeholder="50"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <p className="text-xs text-gray-11">
            {t('Credits count at their dollar value. Resets on the 1st (UTC).')}
          </p>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {!isNil(currentLimit) ? (
            <Button variant="ghost" onClick={() => onSave(null)}>
              {t('Remove limit')}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              {t('Cancel')}
            </Button>
            <Button
              disabled={!(Number(value) >= 1)}
              onClick={() => onSave(Math.round(Number(value)))}
            >
              {t('Save limit')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const ESTIMATED_BADGE_SHARE = 0.2;
const WARN_SHARE = 0.8;

type UsageTableProps = {
  rows: UsageRow[];
  totals: UsageTotals;
  groupBy: UsageGroupBy;
  creditUsdValue: number;
};

type SetLimitDialogProps = {
  row: UsageRow | null;
  currentLimit: number | null;
  onClose: () => void;
  onSave: (value: number | null) => void;
};
