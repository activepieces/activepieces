import { isNil } from '@activepieces/core-utils';
import { t } from 'i18next';
import { useState } from 'react';

import { adminSurface } from '@/app/components/admin';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

import { SetLimitDialog } from './set-limit-dialog';
import { UsageItem } from './usage-dummy-data';
import { usageFormat } from './usage-format';

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
