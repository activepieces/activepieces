import {
  WorkerGroupProjectAssignment,
  WorkerGroupsOverview,
} from '@activepieces/shared';
import { t } from 'i18next';
import { ArrowLeft } from 'lucide-react';
import React, { useState } from 'react';

import { StatusDot, adminSurface } from '@/app/components/admin';
import { Button } from '@/components/ui/button';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { cn } from '@/lib/utils';

import { AddItemsDialog } from './add-items-dialog';
import { groupUtils } from './hooks';
import { MoveAllDialog } from './move-all-dialog';
import { FlowsTable, ProjectsTable } from './tables';

export function GroupPage({
  overview,
  groupKey,
  search,
  onSearchChange,
  cursor,
  onCursorChange,
  onBack,
  onOpenFlows,
  showRunLimit,
}: {
  overview: WorkerGroupsOverview;
  groupKey: string;
  search: string;
  onSearchChange: (value: string) => void;
  cursor: string | undefined;
  onCursorChange: (cursor: string | undefined) => void;
  onBack: () => void;
  onOpenFlows: (project: WorkerGroupProjectAssignment) => void;
  showRunLimit: boolean;
}) {
  const { label, scope } = groupUtils.fromKey(groupKey);
  const group = groupUtils.find({ overview, label, scope });
  const isShared = label === null;
  const [adding, setAdding] = useState(false);
  const [movingAll, setMovingAll] = useState(false);

  const back = (
    <button
      type="button"
      onClick={onBack}
      className="inline-flex w-fit items-center gap-1 text-sm font-medium text-gray-11 hover:text-gray-12"
    >
      <ArrowLeft className="size-4" />
      {t('All groups')}
    </button>
  );

  if (!isShared && !group) {
    return (
      <div className="flex flex-col gap-5">
        <div
          className={cn(
            adminSurface.card,
            'flex flex-col items-start gap-3 p-5',
          )}
        >
          <h2 className="text-lg font-semibold text-gray-12">
            {t('Group not found')}
          </h2>
          <p className="text-sm text-gray-11">
            {t(
              'No worker group called {name} exists on this platform. It may have been renamed, or its workers stopped.',
              {
                name: groupUtils.name(label),
              },
            )}
          </p>
          <Button variant="outline" size="sm" onClick={onBack}>
            {t('Back to all groups')}
          </Button>
        </div>
      </div>
    );
  }

  const forFlows = scope === 'flow';
  const inUse = group ? groupUtils.inUse(group) : true;
  const online = group ? group.online : overview.defaultGroup.online;
  const slots = group ? group.slots : overview.defaultGroup.slots;

  return (
    <div className="flex flex-col gap-5">
      {back}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="truncate text-xl font-semibold text-gray-12">
            {groupUtils.name(label)}
          </h2>
          <p className="text-sm text-gray-11">
            {isShared
              ? t(
                  'Projects that are not in a group run here, with their flows.',
                )
              : forFlows
              ? t(
                  'Only the flows listed here run on this group. Their projects stay where they are.',
                )
              : t(
                  'The projects listed here run on this group, with all their flows, unless a flow has its own group.',
                )}
          </p>
          {label && (
            <p className="text-xs text-gray-10">
              {t('Workers join this group with')}{' '}
              <code className="rounded bg-gray-3 px-1 py-0.5 font-mono text-gray-12">
                AP_WORKER_GROUP_ID={label}
              </code>
            </p>
          )}
        </div>
        {group && (
          <div className="flex items-center gap-2">
            {inUse && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMovingAll(true)}
              >
                {t('Move all to…')}
              </Button>
            )}
            <Button
              {...adminControl(AdminControl.WORKERS_ASSIGN_OPEN)}
              size="sm"
              onClick={() => setAdding(true)}
            >
              {forFlows ? t('Add flows') : t('Add projects')}
            </Button>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 text-sm">
        <GroupStatus
          online={online}
          slots={slots}
          waiting={group?.waiting ?? 0}
          inUse={inUse}
        />
        {group && group.online === 0 && inUse && (
          <span className="text-gray-11">
            {forFlows
              ? t(
                  'Runs sent here wait until a worker is back. Move its flows to another group to keep them running.',
                )
              : t(
                  'Runs sent here wait until a worker is back. Move its projects to another group to keep them running.',
                )}
          </span>
        )}
      </div>
      {forFlows && label ? (
        <FlowsTable
          overview={overview}
          group={label}
          showRemove
          emptyText={t(
            'No flows run on this group yet. Use Add flows to pick some.',
          )}
        />
      ) : (
        <ProjectsTable
          overview={overview}
          label={label}
          search={search}
          onSearchChange={onSearchChange}
          cursor={cursor}
          onCursorChange={onCursorChange}
          onOpenFlows={onOpenFlows}
          showRunLimit={showRunLimit}
          showRemove={!isShared}
          emptyText={
            isShared
              ? t('Every project is in a group.')
              : t(
                  'No projects run on this group yet. Use Add projects to pick some.',
                )
          }
        />
      )}
      {group && label && (
        <>
          <AddItemsDialog
            open={adding}
            onOpenChange={setAdding}
            overview={overview}
            label={label}
            kind={forFlows ? 'flow' : 'project'}
          />
          <MoveAllDialog
            group={group}
            overview={overview}
            open={movingAll}
            onOpenChange={setMovingAll}
          />
        </>
      )}
    </div>
  );
}

function GroupStatus({
  online,
  slots,
  waiting,
  inUse,
}: {
  online: number;
  slots: number;
  waiting: number;
  inUse: boolean;
}) {
  const down = online === 0 && inUse;
  const parts =
    online > 0
      ? [
          t('{count, plural, =1 {1 worker online} other {# workers online}}', {
            count: online,
          }),
          t('Concurrency {count, number}', {
            count: slots,
          }),
        ]
      : [
          down ? t('No workers online') : t('Not in use'),
          waiting > 0
            ? t('{count, plural, =1 {1 run waiting} other {# runs waiting}}', {
                count: waiting,
              })
            : null,
        ];
  const items = parts
    .filter((part): part is string => part !== null)
    .map((part, i) => (
      <span key={i} className={down ? 'text-danger-11' : 'text-gray-12'}>
        {part}
      </span>
    ));
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm max-sm:gap-x-3">
      <StatusDot
        tone={down ? 'danger' : online > 0 ? 'success' : 'neutral'}
        className="mr-0.5 shrink-0"
      />
      {items.map((item, i) => (
        <span key={i} className="inline-flex items-center gap-1.5">
          {i > 0 && (
            <span aria-hidden className="text-gray-10 max-sm:hidden">
              ·
            </span>
          )}
          {item}
        </span>
      ))}
    </p>
  );
}
