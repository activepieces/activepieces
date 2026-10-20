import { isNil } from '@activepieces/core-utils';
import { t } from 'i18next';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { adminSurface } from '@/app/components/admin';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

import { SetLimitDialog } from './set-limit-dialog';
import { DeltaChip, ItemIcon } from './usage-bits';
import {
  UsageItem,
  UsagePeriod,
  UsagePoint,
  UsageScope,
} from './usage-dummy-data';
import { usageFormat } from './usage-format';
import { UsageLineChart } from './usage-hero';
import { UsageTopRow } from './usage-top-list';

export function UsageChangesCard({
  risers,
  period,
  search,
  className,
}: UsageChangesCardProps) {
  return (
    <section
      className={cn(adminSurface.card, 'flex flex-col gap-3 p-5', className)}
    >
      <div className="flex flex-col gap-0.5">
        <h2 className="text-base font-semibold text-gray-12">
          {t('Biggest changes')}
        </h2>
        <p className="text-xs text-gray-11">
          {usageFormat.previousLabel({ period })}
        </p>
      </div>
      <ul className="flex flex-col gap-1">
        {risers.map((item) => (
          <li key={item.id}>
            <Link
              to={`/platform/ai/usage/${item.dimension}/${item.id}${search}`}
              className="flex items-center gap-2.5 rounded-md py-1.5 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-gray-8/50"
            >
              <ItemIcon item={item} />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-gray-12">
                  {item.name}
                </span>
                <span className="truncate text-xs text-gray-11">
                  {t('{type} in {parent}', {
                    type: usageFormat.dimensionBadge({
                      dimension: item.dimension,
                    }),
                    parent: item.parent ?? '',
                  })}
                </span>
              </div>
              <div className="flex shrink-0 flex-col items-end">
                <span className="text-sm font-medium tabular-nums text-gray-12">
                  {item.spendUsd >= item.previousSpendUsd ? '+' : '−'}
                  {usageFormat.usd(
                    Math.abs(item.spendUsd - item.previousSpendUsd),
                  )}
                </span>
                <DeltaChip
                  size="xs"
                  value={usageFormat.change({
                    current: item.spendUsd,
                    previous: item.previousSpendUsd,
                  })}
                />
              </div>
              <ChevronRight className="size-4 shrink-0 text-gray-9" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function UsageLimitsCard({
  projects,
  className,
}: {
  projects: UsageItem[];
  className?: string;
}) {
  const [limits, setLimits] = useState<Record<string, number | null>>({});
  const [editing, setEditing] = useState<UsageItem | null>(null);
  return (
    <section
      className={cn(adminSurface.card, 'flex flex-col gap-3 p-5', className)}
    >
      <div className="flex flex-col gap-0.5">
        <h2 className="text-base font-semibold text-gray-12">
          {t('Limits at risk')}
        </h2>
        <p className="text-xs text-gray-11">
          {t('Projects at 80% or more of their monthly limit')}
        </p>
      </div>
      <ul className="flex flex-col gap-4">
        {projects.map((project) => {
          const limit =
            project.id in limits
              ? limits[project.id]
              : project.monthlyLimitUsd ?? null;
          const spent = project.monthToDateUsd ?? 0;
          const used = isNil(limit) ? 0 : spent / limit;
          return (
            <li key={project.id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-gray-12">
                  {project.name}
                </span>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setEditing(project)}
                >
                  {t('Raise limit')}
                </Button>
              </div>
              <Progress
                value={Math.min(used * 100, 100)}
                className={cn(
                  'h-1.5',
                  used >= 1 ? '*:bg-danger-9' : '*:bg-warning-9',
                )}
              />
              <span
                className={cn(
                  'text-xs tabular-nums',
                  used >= 1 ? 'font-medium text-danger-11' : 'text-warning-11',
                )}
              >
                {isNil(limit)
                  ? t('No limit')
                  : used >= 1
                  ? t('Limit reached · {spent} of {limit}', {
                      spent: usageFormat.usd(spent),
                      limit: usageFormat.usd(limit),
                    })
                  : t('{spent} of {limit} this month', {
                      spent: usageFormat.usd(spent),
                      limit: usageFormat.usd(limit),
                    })}
              </span>
            </li>
          );
        })}
      </ul>
      <SetLimitDialog
        open={!isNil(editing)}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
          }
        }}
        projectName={editing?.name ?? ''}
        currentLimitUsd={
          isNil(editing)
            ? null
            : editing.id in limits
            ? limits[editing.id]
            : editing.monthlyLimitUsd ?? null
        }
        onSave={(value) => {
          if (!isNil(editing)) {
            setLimits({ ...limits, [editing.id]: value });
          }
          setEditing(null);
        }}
      />
    </section>
  );
}

export function UsageTestingSection({
  testing,
  scope,
  search,
}: UsageTestingSectionProps) {
  const tested = [...testing.topFlows, ...testing.topAgents];
  const testedTotal = tested.reduce((sum, item) => sum + item.spendUsd, 0);
  return (
    <section
      className={cn(
        adminSurface.card,
        'grid grid-cols-1 gap-6 p-5 lg:grid-cols-12',
      )}
    >
      <div className="flex flex-col gap-3 lg:col-span-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold text-gray-12">
            {t('Testing')}
          </h2>
          <p className="text-xs text-gray-11">
            {scope === 'all'
              ? t(
                  'Test runs from the flow builder and the agent builder. Included in the totals above.',
                )
              : t(
                  'Test runs from the flow builder and the agent builder. Not in the totals above; pick All to add them.',
                )}
          </p>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold tracking-tight tabular-nums text-gray-12">
            {usageFormat.usd(testing.spendUsd)}
          </span>
          <span className="text-sm text-gray-11">
            {t('{share} of all AI spend', {
              share: usageFormat.percent(testing.share),
            })}
          </span>
        </div>
        <UsageLineChart
          points={testing.series}
          metric="spend"
          height={72}
          compact
        />
      </div>
      <div className="flex flex-col gap-1 lg:col-span-4">
        <h3 className="text-sm font-medium text-gray-11">
          {t('Most tested flows')}
        </h3>
        <ul className="flex flex-col gap-1">
          {testing.topFlows.map((item) => (
            <UsageTopRow
              key={item.id}
              item={item}
              totalUsd={testedTotal}
              search={search}
            />
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-1 lg:col-span-4">
        <h3 className="text-sm font-medium text-gray-11">
          {t('Most tested agents')}
        </h3>
        <ul className="flex flex-col gap-1">
          {testing.topAgents.map((item) => (
            <UsageTopRow
              key={item.id}
              item={item}
              totalUsd={testedTotal}
              search={search}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}

type UsageChangesCardProps = {
  risers: UsageItem[];
  period: UsagePeriod;
  search: string;
  className?: string;
};

type UsageTestingSectionProps = {
  testing: {
    spendUsd: number;
    share: number;
    series: UsagePoint[];
    topFlows: UsageItem[];
    topAgents: UsageItem[];
  };
  scope: UsageScope;
  search: string;
};
