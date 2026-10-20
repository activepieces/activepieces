import { t } from 'i18next';
import { CalendarClock, Download } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import {
  USAGE_PERIODS,
  USAGE_PRESETS,
  UsageDataPreset,
  UsagePreset,
  USAGE_SCOPES,
  UsageItem,
  UsagePeriod,
  UsagePoint,
  UsageScope,
} from './usage-dummy-data';
import { usageFormat } from './usage-format';

export function useUsageView(): UsageView {
  const [searchParams, setSearchParams] = useSearchParams();
  const period =
    USAGE_PERIODS.find((item) => item === searchParams.get('period')) ??
    DEFAULT_PERIOD;
  const scope =
    USAGE_SCOPES.find((item) => item === searchParams.get('scope')) ??
    DEFAULT_SCOPE;
  const preset =
    USAGE_PRESETS.find((item) => item === searchParams.get('preset')) ??
    DEFAULT_PRESET;
  const update = ({
    key,
    value,
    fallback,
  }: {
    key: string;
    value: string;
    fallback: string;
  }): void => {
    const next = new URLSearchParams(searchParams);
    if (value === fallback) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  };
  return {
    period,
    scope,
    preset,
    dataPreset:
      preset === 'loading' || preset === 'error' ? DEFAULT_PRESET : preset,
    search:
      searchParams.toString().length === 0 ? '' : `?${searchParams.toString()}`,
    setPeriod: (value) =>
      update({ key: 'period', value, fallback: DEFAULT_PERIOD }),
    setPreset: (value) =>
      update({ key: 'preset', value, fallback: DEFAULT_PRESET }),
    setScope: (value) =>
      update({ key: 'scope', value, fallback: DEFAULT_SCOPE }),
  };
}

export function UsageHeaderControls({
  view,
  exportRows,
  exportSeries,
  exportName,
}: UsageHeaderControlsProps) {
  return (
    <>
      <Select
        value={view.period}
        onValueChange={(value) =>
          view.setPeriod(
            USAGE_PERIODS.find((item) => item === value) ?? DEFAULT_PERIOD,
          )
        }
      >
        <SelectTrigger size="sm" className="w-auto">
          <CalendarClock className="size-4" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent side="bottom" align="end">
          {USAGE_PERIODS.map((period) => (
            <PeriodOption key={period} period={period} />
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
            onSelect={() =>
              downloadItemsCsv({
                items: exportRows,
                fileName: `${exportName}-${view.period}.csv`,
              })
            }
          >
            {t('This view (CSV)')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() =>
              downloadSeriesCsv({
                points: exportSeries,
                fileName: `${exportName}-over-time-${view.period}.csv`,
              })
            }
          >
            {t('Spend over time (CSV)')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

export function UsageScopeTabs({ view }: { view: UsageView }) {
  return (
    <Tabs
      value={view.scope}
      onValueChange={(value) =>
        view.setScope(
          USAGE_SCOPES.find((item) => item === value) ?? DEFAULT_SCOPE,
        )
      }
    >
      <TabsList
        variant="outline"
        className="flex w-full gap-1 border-b border-gray-6"
      >
        {USAGE_SCOPES.map((scope) => (
          <Tooltip key={scope}>
            <TooltipTrigger asChild>
              <TabsTrigger
                value={scope}
                variant="outline"
                className="cursor-pointer rounded-t-md px-2.5 pt-1.5 pb-2 text-gray-11 transition-colors hover:bg-gray-3 hover:text-gray-12 data-[state=active]:text-gray-12"
              >
                {usageFormat.scopeLabel({ scope })}
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={6}>
              {scopeHint({ scope })}
            </TooltipContent>
          </Tooltip>
        ))}
      </TabsList>
    </Tabs>
  );
}

function scopeHint({ scope }: { scope: UsageScope }): string {
  switch (scope) {
    case 'production':
      return t('Live flows, agents and chat');
    case 'testing':
      return t('Test runs from the builders');
    case 'all':
      return t('Production and testing together');
  }
}

function PeriodOption({ period }: { period: UsagePeriod }) {
  return (
    <>
      {(period === '7d' || period === 'this-month') && <SelectSeparator />}
      <SelectItem value={period}>
        {usageFormat.periodLabel({ period })}
      </SelectItem>
    </>
  );
}

function downloadItemsCsv({
  items,
  fileName,
}: {
  items: UsageItem[];
  fileName: string;
}): void {
  const header = [
    'type',
    'id',
    'name',
    'parent',
    'spend_usd',
    'previous_spend_usd',
    'calls',
    'tokens',
  ];
  const rows = items.map((item) => [
    item.dimension,
    item.id,
    item.name,
    item.parent ?? '',
    item.spendUsd.toFixed(4),
    item.previousSpendUsd.toFixed(4),
    item.calls,
    item.tokens,
  ]);
  downloadCsv({ fileName, rows: [header, ...rows] });
}

function downloadSeriesCsv({
  points,
  fileName,
}: {
  points: UsagePoint[];
  fileName: string;
}): void {
  const header = ['bucket', 'spend_usd', 'previous_period_spend_usd'];
  const rows = points.map((point) => [
    point.label,
    point.current.toFixed(4),
    point.previous.toFixed(4),
  ]);
  downloadCsv({ fileName, rows: [header, ...rows] });
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

const DEFAULT_PERIOD: UsagePeriod = 'this-month';
const DEFAULT_SCOPE: UsageScope = 'production';
const DEFAULT_PRESET: UsageDataPreset = 'rich';

export type UsageView = {
  period: UsagePeriod;
  scope: UsageScope;
  preset: UsagePreset;
  dataPreset: UsageDataPreset;
  setPreset: (preset: UsagePreset) => void;
  search: string;
  setPeriod: (period: UsagePeriod) => void;
  setScope: (scope: UsageScope) => void;
};

type UsageHeaderControlsProps = {
  view: UsageView;
  exportRows: UsageItem[];
  exportSeries: UsagePoint[];
  exportName: string;
};
