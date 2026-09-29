import { PieceSet, RequiredActionsMode } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  pieceSetMutations,
  AdminRequiredActionGroup,
  AdminRequiredActionRow,
  RequiredActionsList,
  useRequiredActionGroups,
} from '@/features/piece-sets';

export function RequiredActionsControls({ pieceSet }: { pieceSet: PieceSet }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { mutate: updateSet, isPending } =
    pieceSetMutations.useUpdatePieceSet();
  const { requiredActions } = pieceSet.config;
  const { groups } = useRequiredActionGroups({
    actions: requiredActions.actions,
  });
  const requiredActionRows = groups.flatMap((group) => group.actions);
  const notInLatestPieceVersionCount = requiredActionRows.filter(
    (action) => action.notInLatestPieceVersion,
  ).length;

  return (
    <div className="flex items-center gap-2">
      <Tabs
        activationMode="manual"
        value={requiredActions.mode}
        onValueChange={(mode) =>
          updateSet({
            id: pieceSet.id,
            request: { requiredActions: { mode: toRequiredActionsMode(mode) } },
          })
        }
      >
        <TabsList className="h-8">
          <TabsTrigger value={RequiredActionsMode.ANY} disabled={isPending}>
            {t('Any')}
          </TabsTrigger>
          <TabsTrigger value={RequiredActionsMode.ALL} disabled={isPending}>
            {t('All')}
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1 rounded-lg"
        disabled={requiredActionRows.length === 0}
        onClick={() => setSheetOpen(true)}
      >
        {requiredActionRows.length === 0 ? (
          <span className="text-muted-foreground">{t('No actions')}</span>
        ) : (
          <>
            <span>
              {t('requiredActionsCount', { count: requiredActionRows.length })}
            </span>
            {notInLatestPieceVersionCount > 0 && (
              <span className="text-warning-700 dark:text-warning-300">
                {t('deletedActionsCount', {
                  count: notInLatestPieceVersionCount,
                })}
              </span>
            )}
          </>
        )}
        <ChevronRight className="size-3.5 text-muted-foreground" />
      </Button>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[480px] sm:max-w-[480px] flex flex-col gap-0 p-0">
          <RequiredActionsSheetContent
            key={sheetOpen ? 'open' : 'closed'}
            pieceSet={pieceSet}
            onClose={() => setSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function RequiredActionsSheetContent({
  pieceSet,
  onClose,
}: {
  pieceSet: PieceSet;
  onClose: () => void;
}) {
  const { mutate: updateSet, isPending } =
    pieceSetMutations.useUpdatePieceSet();
  const [requiredActions, setRequiredActions] = useState(
    pieceSet.config.requiredActions.actions,
  );
  const { groups } = useRequiredActionGroups({ actions: requiredActions });
  const groupsInLatestPieceVersion = filterGroupActions({
    groups,
    keep: (action) => !action.notInLatestPieceVersion,
  });
  const groupsNotInLatestPieceVersion = filterGroupActions({
    groups,
    keep: (action) => action.notInLatestPieceVersion,
  });

  const removeRequiredActions = ({
    pieceName,
    actionNames,
  }: {
    pieceName: string;
    actionNames: string[];
  }) =>
    setRequiredActions((prev) => ({
      ...prev,
      [pieceName]: (prev[pieceName] ?? []).filter(
        (actionName) => !actionNames.includes(actionName),
      ),
    }));

  const handleSave = () =>
    updateSet(
      {
        id: pieceSet.id,
        request: { requiredActions: { actions: requiredActions } },
      },
      { onSuccess: onClose },
    );

  return (
    <>
      <SheetHeader className="px-6 py-4 shrink-0">
        <SheetTitle className="text-base">{t('Required actions')}</SheetTitle>
        <SheetDescription>
          {pieceSet.config.requiredActions.mode === RequiredActionsMode.ALL
            ? t('A flow must contain all of these actions to publish.')
            : t(
                'A flow must contain at least one of these actions to publish.',
              )}
        </SheetDescription>
      </SheetHeader>
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {groups.every((group) => group.actions.length === 0) ? (
          <p className="text-sm text-muted-foreground">
            {t(
              'You are going to remove all the required actions. After you save, flows no longer need them to publish.',
            )}
          </p>
        ) : (
          <RequiredActionsList
            groups={groupsInLatestPieceVersion}
            onRemove={removeRequiredActions}
          />
        )}
      </div>
      {groupsNotInLatestPieceVersion.length > 0 && (
        <div className="shrink-0 border-t bg-warning/10 px-6 py-4 flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-warning-700 dark:text-warning-300">
            {t('Not in the latest version')}
          </span>
          <p className="text-xs text-muted-foreground">
            {t('These actions are ignored. Publish does not check them.')}
          </p>
          <RequiredActionsList
            groups={groupsNotInLatestPieceVersion}
            onRemove={removeRequiredActions}
          />
        </div>
      )}
      <div className="px-6 py-4 border-t shrink-0 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={isPending}>
          {t('Cancel')}
        </Button>
        <Button disabled={isPending} loading={isPending} onClick={handleSave}>
          {t('Save changes')}
        </Button>
      </div>
    </>
  );
}

function filterGroupActions({
  groups,
  keep,
}: {
  groups: AdminRequiredActionGroup[];
  keep: (action: AdminRequiredActionRow) => boolean;
}): AdminRequiredActionGroup[] {
  const filteredGroups = groups.map((group) => ({
    ...group,
    actions: group.actions.filter(keep),
  }));
  return filteredGroups.filter((group) => group.actions.length > 0);
}

function toRequiredActionsMode(value: string): RequiredActionsMode {
  return value === RequiredActionsMode.ALL
    ? RequiredActionsMode.ALL
    : RequiredActionsMode.ANY;
}
