import { t } from 'i18next';
import {
  CalendarClock,
  Coins,
  Download,
  Hash,
  Receipt,
  TriangleAlert,
  Type,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { AdminPageHeader, StatCard, StatGrid } from '@/app/components/admin';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { UsageChart } from './usage-chart';
import {
  USAGE_GROUPS,
  USAGE_PERIODS,
  usageDummyData,
  UsageGroupBy,
  UsagePeriod,
  UsageSummary,
} from './usage-dummy-data';
import { usageFormat } from './usage-format';
import { UsageTable } from './usage-table';

export function UsageTab() {
  const [period, setPeriod] = useState<UsagePeriod>('this-month');
  const [groupBy, setGroupBy] = useState<UsageGroupBy>('project');
  const [includeTestRuns, setIncludeTestRuns] = useState(false);
  const summary = useMemo(
    () => usageDummyData.buildSummary({ period, groupBy, includeTestRuns }),
    [period, groupBy, includeTestRuns],
  );
  const { totals } = summary;
  const ownKeyUsd = totals.exactUsd + totals.estimatedUsd;
  const exactShare = ownKeyUsd === 0 ? 1 : totals.exactUsd / ownKeyUsd;

  return (
    <>
      <AdminPageHeader
        title={t('Usage')}
        description={
          <div className="flex flex-col gap-1">
            <span>
              {t(
                'AI spend across flows, agents and chat, for your own keys and credits.',
              )}
            </span>
            <span className="text-xs">
              {t(
                'Updated {minutes} min ago · Tracking since {date} · {share} of own-key spend is exact',
                {
                  minutes: summary.dataThroughMinutesAgo,
                  date: new Date(
                    `${summary.trackingSince}T00:00:00Z`,
                  ).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    timeZone: 'UTC',
                  }),
                  share: usageFormat.percent(exactShare),
                },
              )}
            </span>
          </div>
        }
      >
        <div className="flex items-center gap-2">
          <Switch
            id="usage-include-test-runs"
            checked={includeTestRuns}
            onCheckedChange={setIncludeTestRuns}
          />
          <Label
            htmlFor="usage-include-test-runs"
            className="text-sm font-normal text-gray-11"
          >
            {t('Include test runs')}
          </Label>
        </div>
        <Select
          value={period}
          onValueChange={(value) => setPeriod(periodFrom({ value }))}
        >
          <SelectTrigger size="sm" className="w-auto">
            <CalendarClock className="size-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent side="bottom" align="end">
            {USAGE_PERIODS.map((item) => (
              <PeriodItem key={item} period={item} />
            ))}
          </SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="size-4" />
              {t('Export')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={() => downloadTableCsv({ summary, groupBy, period })}
            >
              {t('This table (CSV)')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => downloadDailyRowsCsv({ summary, period })}
            >
              {t('Daily rows for {period} (CSV)', {
                period: usageFormat.periodLabel({ period }).toLowerCase(),
              })}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </AdminPageHeader>

      {totals.unpricedCalls > 0 && (
        <Alert variant="warning">
          <TriangleAlert />
          <AlertTitle>
            {t('{calls} calls have no price', {
              calls: usageFormat.whole(totals.unpricedCalls),
            })}
          </AlertTitle>
          <AlertDescription>
            {t(
              'Their cost is not in these totals. Set a custom price on the key, or check your provider dashboard.',
            )}
          </AlertDescription>
        </Alert>
      )}

      <StatGrid columns={4}>
        <StatCard
          label={t('Own-key spend')}
          icon={<Receipt />}
          value={usageFormat.usd(ownKeyUsd)}
          hint={t('{exact} exact · {estimated} estimated', {
            exact: usageFormat.usd(totals.exactUsd),
            estimated: usageFormat.usd(totals.estimatedUsd),
          })}
          info={t(
            'Exact is the cost the provider reported. Estimated is tokens times list price.',
          )}
        />
        <StatCard
          label={t('Credits used')}
          icon={<Coins />}
          value={usageFormat.whole(totals.credits)}
          hint={t('About {amount}', {
            amount: usageFormat.usd(totals.credits * summary.creditUsdValue),
          })}
        />
        <StatCard
          label={t('AI calls')}
          icon={<Hash />}
          value={usageFormat.whole(totals.calls)}
          hint={t('{calls} unpriced', {
            calls: usageFormat.whole(totals.unpricedCalls),
          })}
        />
        <StatCard
          label={t('Tokens')}
          icon={<Type />}
          value={usageFormat.compact(totals.inputTokens + totals.outputTokens)}
          hint={t('{cached} of input served from cache', {
            cached: usageFormat.percent(
              totals.inputTokens === 0
                ? 0
                : totals.cacheReadTokens / totals.inputTokens,
            ),
          })}
        />
      </StatGrid>

      <UsageChart points={summary.points} title={t('Spend over time')} />

      <div className="flex flex-col gap-4">
        <Tabs
          value={groupBy}
          onValueChange={(value) => setGroupBy(groupFrom({ value }))}
        >
          <TabsList className="max-w-full overflow-x-auto">
            {USAGE_GROUPS.map((item) => (
              <TabsTrigger key={item} value={item}>
                {usageFormat.groupLabel({ groupBy: item })}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <UsageTable
          rows={summary.rows}
          totals={totals}
          groupBy={groupBy}
          creditUsdValue={summary.creditUsdValue}
        />
      </div>
    </>
  );
}

function PeriodItem({ period }: { period: UsagePeriod }) {
  return (
    <>
      {period === '7d' && <SelectSeparator />}
      {period === 'this-month' && <SelectSeparator />}
      <SelectItem value={period}>
        {usageFormat.periodLabel({ period })}
      </SelectItem>
    </>
  );
}

function periodFrom({ value }: { value: string }): UsagePeriod {
  return USAGE_PERIODS.find((item) => item === value) ?? 'this-month';
}

function groupFrom({ value }: { value: string }): UsageGroupBy {
  return USAGE_GROUPS.find((item) => item === value) ?? 'project';
}

function downloadTableCsv({
  summary,
  groupBy,
  period,
}: {
  summary: UsageSummary;
  groupBy: UsageGroupBy;
  period: UsagePeriod;
}): void {
  const header = [
    'name',
    'detail',
    'calls',
    'input_tokens',
    'output_tokens',
    'cached_tokens',
    'exact_usd',
    'estimated_usd',
    'credits',
    'unpriced_calls',
  ];
  const lines = summary.rows.map((row) => [
    row.name,
    row.subtitle ?? '',
    row.calls,
    row.inputTokens,
    row.outputTokens,
    row.cacheReadTokens,
    row.exactUsd.toFixed(4),
    row.estimatedUsd.toFixed(4),
    row.credits,
    row.unpricedCalls,
  ]);
  downloadCsv({
    fileName: `ai-usage-${groupBy}-${period}.csv`,
    rows: [header, ...lines],
  });
}

function downloadDailyRowsCsv({
  summary,
  period,
}: {
  summary: UsageSummary;
  period: UsagePeriod;
}): void {
  const header = ['bucket', 'exact_usd', 'estimated_usd', 'credits_usd'];
  const lines = summary.points.map((point) => [
    point.label,
    point.exactUsd.toFixed(4),
    point.estimatedUsd.toFixed(4),
    point.creditsUsd.toFixed(4),
  ]);
  downloadCsv({
    fileName: `ai-usage-daily-${period}.csv`,
    rows: [header, ...lines],
  });
}

function downloadCsv({
  fileName,
  rows,
}: {
  fileName: string;
  rows: Array<Array<string | number>>;
}): void {
  const text = rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','),
    )
    .join('\n');
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
