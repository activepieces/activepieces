import { t } from 'i18next';
import {
  Activity,
  CalendarClock,
  FlaskConical,
  Layers,
  LucideIcon,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  USAGE_PERIODS,
  USAGE_PRESETS,
  UsageDataPreset,
  UsagePreset,
  USAGE_SCOPES,
  UsagePeriod,
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

export function UsageHeaderControls({ view }: { view: UsageView }) {
  return (
    <>
      <ScopeSelect view={view} />
      <PeriodSelect view={view} />
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
        className={TRIGGER_CLASS}
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
        className={TRIGGER_CLASS}
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

const TRIGGER_CLASS =
  'w-auto cursor-pointer gap-1.5 border-gray-6 bg-gray-1 px-2.5 shadow-none hover:bg-gray-4 hover:text-gray-12';
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
