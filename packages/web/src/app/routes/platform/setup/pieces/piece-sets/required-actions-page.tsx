import { unique } from '@activepieces/core-utils';
import { isPieceVisible, PieceSet } from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import {
  AdminPage,
  AdminPageHeader,
  AdminQueryState,
  SaveBar,
  SettingsPanel,
  adminBulk,
  adminPageResources,
  useAdminAction,
} from '@/app/components/admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChangePieceSet,
  pieceSetChanges,
  pieceSetKeys,
  pieceSetQueries,
  pieceSetsApi,
  pieceSetTerms,
  usePieceSetChange,
} from '@/features/piece-sets';
import { pieceCacheUtils } from '@/features/pieces';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { cn } from '@/lib/utils';

import { pieceSetSamples } from './piece-set-samples';
import { PolicySheet, useGuardedClose } from './policy-ui';
import {
  ActionPicker,
  PiecePicker,
  PublishingRuleSentence,
  RequiredActionsList,
  RequiredActionsSheet,
} from './required-actions';

export function RequiredActionsPage() {
  const { platform } = platformHooks.useCurrentPlatform();
  const locked = !platform.plan.managePiecesEnabled;
  const { data, isLoading, isError, refetch } =
    pieceSetQueries.useAllPieceSets();
  const pieceSets = locked
    ? pieceSetSamples.samplePieceSets({ pieceNames: [] })
    : data ?? [];
  const [adding, setAdding] = useState(false);

  return (
    <AdminPage>
      <AdminPageHeader
        title={t('Required actions')}
        description={t(
          'The actions a flow must use before it can be published, {term} by {term}. Require an action in several {terms} at once, or edit one {term} at a time.',
          pieceSetTerms.get(),
        )}
        resources={adminPageResources.pieces}
      >
        <Button
          {...adminControl(AdminControl.PIECE_SETS_REQUIRED_BULK_OPEN)}
          disabled={locked || pieceSets.length === 0}
          onClick={() => setAdding(true)}
        >
          <Plus />
          {t('Require in several {terms}', pieceSetTerms.get())}
        </Button>
      </AdminPageHeader>
      <AdminQueryState
        isLoading={!locked && isLoading}
        isError={!locked && isError}
        hasData={data !== undefined}
        onRetry={refetch}
        entity={pieceSetTerms.get().terms}
        skeleton={<SetRulesSkeleton />}
      >
        <SettingsPanel flush>
          {pieceSets.map((pieceSet) =>
            locked ? (
              <SetRule
                key={pieceSet.id}
                pieceSet={pieceSet}
                onChange={async () => false}
              />
            ) : (
              <LiveSetRule key={pieceSet.id} pieceSet={pieceSet} />
            ),
          )}
        </SettingsPanel>
      </AdminQueryState>
      {adding && (
        <RequireAcrossSetsSheet
          pieceSets={pieceSets}
          onClose={() => setAdding(false)}
        />
      )}
    </AdminPage>
  );
}

function SetRulesSkeleton() {
  return (
    <SettingsPanel flush>
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={index}
          className="flex flex-col gap-3 p-5 md:flex-row md:items-start md:gap-6"
        >
          <div className="flex flex-col gap-1.5 md:w-56 md:shrink-0">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-8 w-28" />
        </div>
      ))}
    </SettingsPanel>
  );
}

function LiveSetRule({ pieceSet }: { pieceSet: PieceSet }) {
  const change = usePieceSetChange(pieceSet.id);
  return <SetRule pieceSet={pieceSet} onChange={change} />;
}

function SetRule({
  pieceSet,
  onChange,
}: {
  pieceSet: PieceSet;
  onChange: ChangePieceSet;
}) {
  const [editing, setEditing] = useState(false);
  const requiredCount = pieceSetChanges.countRequiredActions(pieceSet.config);
  const mode = pieceSet.config.requiredActions.mode;
  return (
    <section className="flex flex-col gap-3 p-5 md:flex-row md:items-start md:gap-6">
      <div className="flex min-w-0 flex-col gap-1 md:w-56 md:shrink-0">
        <Link
          to={`/platform/pieces/piece-sets/${pieceSet.id}`}
          className="flex min-w-0 items-center gap-2 text-sm font-medium text-gray-12 hover:underline"
        >
          <span className="truncate">{pieceSet.name}</span>
          {pieceSet.isDefault && (
            <Badge variant="outline">{t('Default')}</Badge>
          )}
        </Link>
        <span className="text-xs text-gray-11">
          {t(
            '{count, plural, =0 {No required actions} =1 {1 required action} other {# required actions}}',
            { count: requiredCount },
          )}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <PublishingRuleSentence
          count={requiredCount}
          mode={mode}
          onChange={onChange}
        />
        <RequiredActionsList pieceSet={pieceSet} onChange={onChange} />
      </div>
      <Button
        {...adminControl(AdminControl.PIECE_SETS_REQUIRED_OPEN)}
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => setEditing(true)}
      >
        {requiredCount === 0 ? t('Require an action') : t('Edit actions')}
      </Button>
      <RequiredActionsSheet
        pieceSet={pieceSet}
        open={editing}
        onOpenChange={setEditing}
        onChange={onChange}
      />
    </section>
  );
}

function RequireAcrossSetsSheet({
  pieceSets,
  onClose,
}: {
  pieceSets: PieceSet[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [pieceName, setPieceName] = useState<string | null>(null);
  const [actionNames, setActionNames] = useState<string[]>([]);
  const [selectedSetIds, setSelectedSetIds] = useState<string[]>([]);
  const [failedSets, setFailedSets] = useState<FailedSets | null>(null);
  const dirty = actionNames.length > 0 || selectedSetIds.length > 0;
  const { requestClose, dialog } = useGuardedClose({ dirty, onClose });
  const availableSets = pieceSets.filter(
    (pieceSet) =>
      pieceName === null ||
      isPieceVisible({ pieces: pieceSet.config.pieces, name: pieceName }),
  );
  const chosenSets = availableSets.filter((pieceSet) =>
    selectedSetIds.includes(pieceSet.id),
  );

  const requireInSets = useAdminAction<PieceSet[]>({
    verb: 'update',
    messages: {
      done: t(
        '{count, plural, =1 {Required in 1 {term}} other {Required in # {terms}}}',
        { ...pieceSetTerms.get(), count: chosenSets.length },
      ),
      failed: t("Couldn't update the publishing rules"),
    },
    run: async (targets) => {
      if (pieceName === null) {
        return;
      }
      try {
        await adminBulk.runEach({
          items: targets,
          verb: 'update',
          feedback: 'none',
          label: (count) =>
            t('{count, plural, =1 {1 {term}} other {# {terms}}}', {
              ...pieceSetTerms.get(),
              count,
            }),
          nameOf: (target) => target.name,
          run: async (target) => {
            const latest = await pieceSetsApi.get(target.id);
            const current =
              latest.config.requiredActions.actions[pieceName] ?? [];
            await pieceSetsApi.update(
              target.id,
              pieceSetChanges.toRequest({
                pieceSet: latest,
                change: {
                  type: 'required',
                  actions: {
                    [pieceName]: unique([...current, ...actionNames]),
                  },
                },
              }),
            );
          },
        });
      } finally {
        pieceCacheUtils.invalidateProjectPieceCaches(queryClient);
        await queryClient.invalidateQueries({ queryKey: pieceSetKeys.all });
      }
    },
    onSuccess: () => onClose(),
    handleError: (error, targets) => {
      const partial = adminBulk.isPartialFailure(error);
      const failed = partial
        ? adminBulk.failedItems({ error, items: targets })
        : targets;
      setFailedSets({ partial, sets: failed });
      setSelectedSetIds(failed.map((pieceSet) => pieceSet.id));
      return true;
    },
  });
  const failedIds = (failedSets?.sets ?? []).map((pieceSet) => pieceSet.id);

  const toggleSet = (id: string) =>
    setSelectedSetIds((prev) =>
      prev.includes(id)
        ? prev.filter((candidate) => candidate !== id)
        : [...prev, id],
    );

  return (
    <>
      <PolicySheet
        open
        onRequestClose={requestClose}
        title={t('Require in several {terms}', pieceSetTerms.get())}
        description={t(
          'Pick the actions, then the {terms} whose flows must use them before they can be published.',
          pieceSetTerms.get(),
        )}
        footer={
          <SaveBar
            dirty={dirty}
            saving={requireInSets.isPending}
            disabled={actionNames.length === 0 || chosenSets.length === 0}
            saveLabel={t(
              '{count, plural, =1 {Require in 1 {term}} other {Require in # {terms}}}',
              { ...pieceSetTerms.get(), count: chosenSets.length },
            )}
            onSave={() => {
              setFailedSets(null);
              requireInSets.mutate(chosenSets);
            }}
            onDiscard={() => {
              setFailedSets(null);
              setPieceName(null);
              setActionNames([]);
              setSelectedSetIds([]);
            }}
            saveControl={AdminControl.PIECE_SETS_REQUIRED_BULK_SUBMIT}
          />
        }
      >
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-gray-12">{t('Actions')}</h3>
          {pieceName === null ? (
            <PiecePicker onPick={setPieceName} />
          ) : (
            <ActionPicker
              pieceName={pieceName}
              requiredNames={actionNames}
              onChange={setActionNames}
              onBack={() => {
                setPieceName(null);
                setActionNames([]);
              }}
            />
          )}
        </section>
        <section className="flex flex-col gap-3 border-t pt-5">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-medium text-gray-12">
              {pieceSetTerms.get().Terms}
            </h3>
            <p className="text-xs text-gray-11">
              {t(
                'In a {term} that hides some of these actions, requiring them shows them again.',
                pieceSetTerms.get(),
              )}
            </p>
          </div>
          {failedSets && (
            <p role="alert" className="text-sm text-danger-11">
              {failedSets.partial
                ? t(
                    "Couldn't update {names}. The other {terms} are saved; save again to retry.",
                    {
                      ...pieceSetTerms.get(),
                      names: failedSets.sets
                        .map((pieceSet) => pieceSet.name)
                        .join(', '),
                    },
                  )
                : t("Couldn't update {names}. Save again to retry.", {
                    names: failedSets.sets
                      .map((pieceSet) => pieceSet.name)
                      .join(', '),
                  })}
            </p>
          )}
          <ul className="flex flex-col rounded-xl border">
            {pieceSets.map((pieceSet) => {
              const hidden =
                pieceName !== null &&
                !isPieceVisible({
                  pieces: pieceSet.config.pieces,
                  name: pieceName,
                });
              const alreadyRequired =
                pieceName !== null &&
                actionNames.length > 0 &&
                actionNames.every((name) =>
                  (
                    pieceSet.config.requiredActions.actions[pieceName] ?? []
                  ).includes(name),
                );
              const reshown =
                pieceName === null || hidden
                  ? 0
                  : actionNames.filter(
                      (actionName) =>
                        !pieceSetChanges.isActionAllowed({
                          pieceSet,
                          pieceName,
                          actionName,
                        }),
                    ).length;
              return (
                <li key={pieceSet.id} className="border-t first:border-t-0">
                  <label
                    className={cn(
                      'flex min-h-11 items-center gap-3 px-3 py-2',
                      hidden ? 'opacity-60' : 'cursor-pointer',
                    )}
                  >
                    <Checkbox
                      checked={!hidden && selectedSetIds.includes(pieceSet.id)}
                      disabled={hidden}
                      onCheckedChange={() => toggleSet(pieceSet.id)}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm text-gray-12">
                      {pieceSet.name}
                    </span>
                    {failedIds.includes(pieceSet.id) && (
                      <span className="shrink-0 text-xs text-danger-11">
                        {t('Not saved')}
                      </span>
                    )}
                    {hidden ? (
                      <span className="shrink-0 text-xs text-gray-11">
                        {t('Piece hidden in this {term}', pieceSetTerms.get())}
                      </span>
                    ) : alreadyRequired ? (
                      <Badge variant="outline" className="shrink-0">
                        {t('Required')}
                      </Badge>
                    ) : (
                      reshown > 0 && (
                        <span className="shrink-0 text-xs text-gray-11">
                          {t(
                            '{count, plural, =1 {Also shows 1 hidden action} other {Also shows # hidden actions}}',
                            { count: reshown },
                          )}
                        </span>
                      )
                    )}
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
      </PolicySheet>
      {dialog}
    </>
  );
}

type FailedSets = { partial: boolean; sets: PieceSet[] };
