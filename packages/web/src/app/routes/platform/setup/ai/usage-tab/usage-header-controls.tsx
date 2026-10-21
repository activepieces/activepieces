import { t } from 'i18next';
import {
  Activity,
  CalendarClock,
  ChartLine,
  ChevronDown,
  Download,
  FlaskConical,
  Layers,
  LucideIcon,
  Table2,
} from 'lucide-react';
import { ReactNode } from 'react';
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
      <ScopeSelect view={view} />
      <PeriodSelect view={view} />
      <ExportMenu
        view={view}
        exportRows={exportRows}
        exportSeries={exportSeries}
        exportName={exportName}
      />
    </>
  );
}

function ScopeSelect({ view }: { view: UsageView }) {
  return (
    <Select
      value={view.scope}
      onValueChange={(value) =>
        view.setScope(
          USAGE_SCOPES.find((item) => item === value) ?? DEFAULT_SCOPE,
        )
      }
    >
      <SelectTrigger
        size="sm"
        className="w-auto cursor-pointer hover:bg-gray-3"
        aria-label={t('Usage scope')}
      >
        <ScopeIcon scope={view.scope} />
        <SelectValue>
          {usageFormat.scopeLabel({ scope: view.scope })}
        </SelectValue>
      </SelectTrigger>
      <SelectContent side="bottom" align="end" className="w-64">
        {USAGE_SCOPES.map((scope) => (
          <SelectItem
            key={scope}
            value={scope}
            className="cursor-pointer items-start *:[span]:last:items-start"
          >
            <span className="flex pt-0.5">
              <ScopeIcon scope={scope} />
            </span>
            <span className="flex flex-col">
              <span className="text-gray-12">
                {usageFormat.scopeLabel({ scope })}
              </span>
              <span className="text-xs text-gray-11">
                {scopeHint({ scope })}
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ScopeIcon({ scope }: { scope: UsageScope }) {
  const Icon = SCOPE_ICONS[scope];
  return <Icon className="size-4 text-gray-11" />;
}

function PeriodSelect({ view }: { view: UsageView }) {
  return (
    <Select
      value={view.period}
      onValueChange={(value) =>
        view.setPeriod(
          USAGE_PERIODS.find((item) => item === value) ?? DEFAULT_PERIOD,
        )
      }
    >
      <SelectTrigger
        size="sm"
        className="w-auto cursor-pointer hover:bg-gray-3"
        aria-label={t('Period')}
      >
        <CalendarClock className="size-4" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent side="bottom" align="end">
        {USAGE_PERIODS.map((period) => (
          <PeriodOption key={period} period={period} />
        ))}
      </SelectContent>
    </Select>
  );
}

function PeriodOption({ period }: { period: UsagePeriod }) {
  return (
    <>
      {(period === '7d' || period === 'this-month') && <SelectSeparator />}
      <SelectItem value={period} className="cursor-pointer">
        {usageFormat.periodLabel({ period })}
      </SelectItem>
    </>
  );
}

function ExportMenu({
  view,
  exportRows,
  exportSeries,
  exportName,
}: UsageHeaderControlsProps) {
  const blocked = exportBlockedReason({ view, exportRows });
  if (blocked !== null) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0} className="rounded-lg">
            <Button variant="outline" size="sm" disabled>
              <ExportLabel />
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={6}>
          {blocked}
        </TooltipContent>
      </Tooltip>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="data-[state=open]:bg-gray-3"
        >
          <ExportLabel />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <ExportItem
          icon={<Table2 />}
          label={t('Breakdown')}
          hint={t('Every item on this page, one row each')}
          onSelect={() =>
            downloadItemsCsv({
              items: exportRows,
              fileName: `${exportName}-${view.scope}-${view.period}.csv`,
            })
          }
        />
        {exportSeries.length > 0 && (
          <ExportItem
            icon={<ChartLine />}
            label={t('Spend over time')}
            hint={t('One row per point on the chart')}
            onSelect={() =>
              downloadSeriesCsv({
                points: exportSeries,
                fileName: `${exportName}-over-time-${view.scope}-${view.period}.csv`,
              })
            }
          />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ExportLabel() {
  return (
    <>
      <Download className="size-4" />
      {t('Export')}
      <ChevronDown className="size-3.5 text-gray-11" />
    </>
  );
}

function ExportItem({
  icon,
  label,
  hint,
  onSelect,
}: {
  icon: ReactNode;
  label: string;
  hint: string;
  onSelect: () => void;
}) {
  return (
    <DropdownMenuItem onSelect={onSelect} className="items-start">
      <span className="flex pt-0.5 text-gray-11">{icon}</span>
      <span className="flex flex-col">
        <span className="text-gray-12">{label}</span>
        <span className="text-xs text-gray-11">{hint}</span>
      </span>
      <span className="ml-auto pt-0.5 text-xs text-gray-11">CSV</span>
    </DropdownMenuItem>
  );
}

function exportBlockedReason({
  view,
  exportRows,
}: {
  view: UsageView;
  exportRows: UsageItem[];
}): string | null {
  if (view.preset === 'loading' || view.preset === 'error') {
    return t('Export is ready once usage loads');
  }
  if (exportRows.length === 0) {
    return t('Nothing to export in this period');
  }
  return null;
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
    point.current === null ? '' : point.current.toFixed(4),
    point.previous === null ? '' : point.previous.toFixed(4),
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

const SCOPE_ICONS: Record<UsageScope, LucideIcon> = {
  all: Layers,
  production: Activity,
  testing: FlaskConical,
};
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
