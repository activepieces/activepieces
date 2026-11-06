import { WorkerGroupSummary, WorkerGroupsOverview } from '@activepieces/shared';
import { t } from 'i18next';
import React, { useState } from 'react';

import { StatusDot, adminLayout, adminSurface } from '@/app/components/admin';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

import { groupUtils, useMover } from './hooks';
import { SearchBox } from './parts';

export function MoveAllDialog({
  group,
  overview,
  open,
  onOpenChange,
  selected,
}: {
  group: WorkerGroupSummary;
  overview: WorkerGroupsOverview | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected?: number;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={adminLayout.dialog.md}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {open && (
          <MoveAllForm
            group={group}
            overview={overview}
            selected={selected}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function MoveAllForm({
  group,
  overview,
  selected,
  onDone,
}: {
  group: WorkerGroupSummary;
  overview: WorkerGroupsOverview | undefined;
  selected: number | undefined;
  onDone: () => void;
}) {
  const [target, setTarget] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const { moveAll } = useMover();
  const forFlows = group.scope === 'flow';
  const targets = (overview?.groups ?? []).filter(
    (g) => g.scope === group.scope && g.label !== group.label,
  );
  const options = [
    {
      key: BACK_KEY,
      name: forFlows
        ? t('Back to each flow’s project group')
        : groupUtils.name(null),
      health: forFlows ? null : overview?.defaultGroup ?? null,
    },
    ...targets.map((g) => ({
      key: g.label,
      name: groupUtils.name(g.label),
      health: g,
    })),
  ].filter((option) =>
    option.name.toLowerCase().includes(filter.trim().toLowerCase()),
  );
  const to = target === BACK_KEY ? null : target;
  const picked =
    target === null
      ? undefined
      : groupUtils.find({ overview, label: to, scope: group.scope });
  const what = forFlows
    ? t('{count, plural, =1 {1 flow} other {# flows}}', {
        count: group.flowCount,
      })
    : t(
        '{projects, plural, =1 {1 project} other {# projects}} ({flows, plural, =1 {1 flow} other {# flows}})',
        {
          projects: group.projectCount,
          flows: group.flowCount,
        },
      );

  return (
    <>
      <DialogHeader className="mb-0">
        <DialogTitle>
          {selected !== undefined
            ? forFlows
              ? t(
                  'Move {count, plural, =1 {1 selected flow} other {# selected flows}}',
                  { count: selected },
                )
              : t(
                  'Move {count, plural, =1 {1 selected project} other {# selected projects}}',
                  { count: selected },
                )
            : t('Move all from {group}', {
                group: groupUtils.name(group.label),
              })}
        </DialogTitle>
        <DialogDescription>
          {[
            t('{what} will move to the group you pick.', { what }),
            group.waiting > 0
              ? t(
                  '{count, plural, =1 {1 waiting run goes with them.} other {# waiting runs go with them.}}',
                  {
                    count: group.waiting,
                  },
                )
              : null,
          ]
            .filter(Boolean)
            .join(' ')}
        </DialogDescription>
      </DialogHeader>
      {targets.length > SEARCH_AFTER && (
        <SearchBox
          value={filter}
          onChange={setFilter}
          placeholder={t('Find a group')}
        />
      )}
      <RadioGroup
        value={target ?? ''}
        onValueChange={setTarget}
        className={cn(
          adminSurface.listFrame,
          adminSurface.divider,
          'max-h-72 gap-0 divide-y overflow-y-auto',
        )}
      >
        {options.map((option) => (
          <label
            key={option.key}
            className="flex h-11 cursor-pointer items-center gap-3 px-3 hover:bg-gray-2"
          >
            <RadioGroupItem value={option.key} />
            <span className="flex-1 truncate text-sm text-gray-12">
              {option.name}
            </span>
            {option.health && (
              <StatusDot
                tone={option.health.online > 0 ? 'success' : 'danger'}
                className={cn(
                  'w-36 shrink-0 text-xs',
                  option.health.online > 0 ? 'text-gray-10' : 'text-danger-11',
                )}
              >
                {option.health.online > 0
                  ? t('Concurrency {count, number}', {
                      count: option.health.slots,
                    })
                  : t('No workers online')}
              </StatusDot>
            )}
          </label>
        ))}
      </RadioGroup>
      {picked && picked.online === 0 && (
        <p className="text-sm text-danger-11">
          {t(
            'The group {group} has no workers online. Runs will wait there until a worker is back.',
            {
              group: groupUtils.name(picked.label),
            },
          )}
        </p>
      )}
      <DialogFooter className="mt-0">
        <Button variant="outline" onClick={onDone}>
          {t('Cancel')}
        </Button>
        <Button
          disabled={target === null}
          loading={saving}
          onClick={() => {
            setSaving(true);
            moveAll({ from: group.label, scope: group.scope, to })
              .then((moved) => moved && onDone())
              .catch(() => undefined)
              .finally(() => setSaving(false));
          }}
        >
          {t('Move')}
        </Button>
      </DialogFooter>
    </>
  );
}

const BACK_KEY = 'back:';
const SEARCH_AFTER = 7;
