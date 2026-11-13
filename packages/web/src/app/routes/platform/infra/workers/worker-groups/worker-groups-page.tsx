import {
  ApFlagId,
  WorkerGroupProjectAssignment,
  WorkerGroupSummary,
} from '@activepieces/shared';
import { t } from 'i18next';
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  AdminPage,
  AdminPageHeader,
  adminLayout,
  adminPageResources,
} from '@/app/components/admin';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { flagsHooks } from '@/hooks/flags-hooks';
import { cn } from '@/lib/utils';

import { AddItemsDialog } from './add-items-dialog';
import { GroupCards } from './group-cards';
import { GroupPage } from './group-page';
import {
  PROJECT_FLOWS_PAGE_SIZE,
  groupUtils,
  workerGroupsQueries,
} from './hooks';
import { SearchBox, modelSentence } from './parts';
import { SearchResults } from './search-results';
import { NoGroupsGuide } from './setup-guide';
import { FlowsTable } from './tables';

export function WorkerGroupsPage() {
  const overviewQuery = workerGroupsQueries.useOverview();
  const overview = overviewQuery.data;
  const { data: runLimitsEnabled } = flagsHooks.useFlag<boolean>(
    ApFlagId.PROJECT_RATE_LIMITER_ENABLED,
  );
  const showRunLimit = runLimitsEnabled === true;
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const groupParam = params.get('group');
  const name = params.get('name') ?? '';
  const cursor = params.get('cursor') ?? undefined;
  const [flowsOf, setFlowsOf] = useState<WorkerGroupProjectAssignment | null>(
    null,
  );
  const [addingTo, setAddingTo] = useState<WorkerGroupSummary | null>(null);
  const searching = query.trim().length > 0;
  const noGroups = overview !== undefined && overview.groups.length === 0;

  const update = (next: Partial<Record<UrlKey, string | null>>) => {
    setParams(
      (prev) => {
        const merged = new URLSearchParams(prev);
        Object.entries(next).forEach(([key, value]) => {
          if (value === null || value === '') merged.delete(key);
          else merged.set(key, value);
        });
        return merged;
      },
      { replace: true },
    );
  };

  const cards = (
    <GroupCards
      overview={overview}
      onOpen={(key) => update({ group: key, name: null, cursor: null })}
      onAdd={setAddingTo}
    />
  );

  return (
    <AdminPage className="max-w-6xl">
      <AdminPageHeader
        title={t('Worker groups')}
        description={groupParam && !searching ? undefined : modelSentence()}
        resources={adminPageResources.workerGroups}
      />
      {overviewQuery.isError && !overview ? (
        <DataFetchErrorState
          entity={t('worker groups')}
          onRetry={() => overviewQuery.refetch()}
        />
      ) : (
        <>
          {(searching || !groupParam) && (
            <SearchBox
              value={query}
              onChange={(value) => update({ q: value })}
              placeholder={t('Where does a project or flow run?')}
            />
          )}
          {searching ? (
            <SearchResults overview={overview} query={query} fallback={cards} />
          ) : groupParam && overview ? (
            <GroupPage
              key={groupParam}
              overview={overview}
              groupKey={groupParam}
              search={name}
              onSearchChange={(value) => update({ name: value, cursor: null })}
              cursor={cursor}
              onCursorChange={(next) => update({ cursor: next ?? null })}
              onBack={() => update({ group: null, name: null, cursor: null })}
              onOpenFlows={setFlowsOf}
              showRunLimit={showRunLimit}
            />
          ) : (
            <>
              {cards}
              {noGroups && <NoGroupsGuide />}
            </>
          )}
        </>
      )}
      <Dialog
        open={flowsOf !== null}
        onOpenChange={(o) => !o && setFlowsOf(null)}
      >
        <DialogContent
          className={cn(
            adminLayout.dialog.lg,
            'flex max-h-[80vh] flex-col overflow-hidden',
          )}
        >
          {flowsOf && (
            <>
              <DialogHeader className="mb-0 shrink-0">
                <DialogTitle className="pr-8">
                  {t('Flows in {project}', { project: flowsOf.displayName })}
                </DialogTitle>
                <DialogDescription>
                  {t(
                    'These flows run on {group}, the project’s group, unless you pick another group for a flow.',
                    {
                      group: groupUtils.name(flowsOf.workerGroupId),
                    },
                  )}
                </DialogDescription>
              </DialogHeader>
              <FlowsTable
                overview={overview}
                projectId={flowsOf.id}
                expectedRows={Math.min(
                  flowsOf.flowCount,
                  PROJECT_FLOWS_PAGE_SIZE,
                )}
                emptyText={t('This project has no flows.')}
                scrollBody
                footerAction={
                  <Button onClick={() => setFlowsOf(null)}>{t('Done')}</Button>
                }
              />
            </>
          )}
        </DialogContent>
      </Dialog>
      {addingTo !== null && (
        <AddItemsDialog
          open
          onOpenChange={(o) => !o && setAddingTo(null)}
          overview={overview}
          label={addingTo.label}
          kind={addingTo.scope}
        />
      )}
    </AdminPage>
  );
}

type UrlKey = 'q' | 'group' | 'name' | 'cursor';
