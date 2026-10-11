import {
  PieceSelection,
  PieceSelectionMode,
  PieceSet,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Navigate, useParams } from 'react-router-dom';

import {
  AdminPage,
  AdminPageHeader,
  AdminQueryState,
  SettingsPanel,
  SettingsRow,
  adminPageResources,
} from '@/app/components/admin';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { pieceSetMutations, pieceSetQueries } from '@/features/piece-sets';
import { piecesHooks } from '@/features/pieces';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';

import { PieceSetPiecesTable } from './piece-set-pieces-table';
import { PieceSetProjectsDialog } from './piece-set-projects-dialog';
import { RequiredActionsTab } from './required-actions-tab';
import { useRequiredActionsGroupedByPiece } from './use-required-actions-grouped-by-piece';

const PieceSetDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const { platform } = platformHooks.useCurrentPlatform();
  const {
    data: pieceSet,
    isLoading,
    isError,
    refetch,
  } = pieceSetQueries.usePieceSet(id ?? '');
  const { pieces, isLoading: piecesLoading } = piecesHooks.usePieces({
    includeHidden: true,
    isTableQuery: true,
    skipProjectFilter: true,
  });
  const { mutate: updateSet } = pieceSetMutations.useUpdatePieceSet();

  const handleToggle = (value: boolean) => {
    if (!pieceSet || !pieces) return;
    updateSet({
      id: pieceSet.id,
      request: {
        pieces: flipSelectionMode({
          current: pieceSet.config.pieces,
          include: value,
          knownPieceNames: pieces.map((p) => p.name),
        }),
      },
    });
  };

  if (!platform.plan.managePiecesEnabled) {
    return <Navigate to="/platform/pieces/piece-sets" replace />;
  }

  if (!pieceSet) {
    return (
      <AdminPage fill>
        <AdminQueryState
          isLoading={isLoading}
          isError={isError || !isLoading}
          onRetry={refetch}
          entity={t('piece set')}
          skeleton={
            <div className="flex flex-col gap-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-64 rounded-xl" />
            </div>
          }
        >
          {null}
        </AdminQueryState>
      </AdminPage>
    );
  }

  return (
    <AdminPage fill>
      <AdminPageHeader
        back={{ label: t('Piece Sets'), to: '/platform/pieces/piece-sets' }}
        title={pieceSet.name}
        badge={
          pieceSet.isDefault && (
            <Badge variant="secondary">{t('Default')}</Badge>
          )
        }
        description={t(
          'Determine which actions and triggers assigned projects can add to their flows.',
        )}
        resources={adminPageResources.pieces}
      />

      <Tabs
        defaultValue="pieces"
        className="flex min-h-0 w-full flex-1 flex-col gap-6"
      >
        <TabsList
          variant="outline"
          className="w-full shrink-0 justify-start border-b border-gray-6"
        >
          <TabsTrigger variant="outline" value="pieces">
            {t('Pieces')}
          </TabsTrigger>
          <TabsTrigger variant="outline" value="requiredActions">
            {t('Required actions')}
            <RequiredActionsCountBadge pieceSet={pieceSet} />
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="pieces"
          className="mt-0 flex min-h-0 flex-1 flex-col gap-6 data-[state=inactive]:hidden"
        >
          <SettingsPanel flush className="shrink-0">
            <SettingsRow title={t('Assigned projects')}>
              <PieceSetProjectsDialog pieceSet={pieceSet} />
            </SettingsRow>
            <SettingsRow
              title={t('Include new pieces')}
              description={t(
                'Applies only to pieces that don’t exist yet — actions are governed per piece below.',
              )}
            >
              <Switch
                {...adminControl(AdminControl.PIECE_SETS_NEW_PIECES_TOGGLE)}
                aria-label={t('Include new pieces')}
                checked={
                  pieceSet.config.pieces.mode === PieceSelectionMode.INCLUDE_ALL
                }
                disabled={piecesLoading}
                onCheckedChange={handleToggle}
              />
            </SettingsRow>
          </SettingsPanel>
          <PieceSetPiecesTable pieceSet={pieceSet} />
        </TabsContent>

        <TabsContent
          value="requiredActions"
          className="mt-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
        >
          <RequiredActionsTab pieceSet={pieceSet} />
        </TabsContent>
      </Tabs>
    </AdminPage>
  );
};

function flipSelectionMode({
  current,
  include,
  knownPieceNames,
}: {
  current: PieceSelection;
  include: boolean;
  knownPieceNames: string[];
}): PieceSelection {
  const excluded = new Set(current.exceptions);
  return {
    mode: include
      ? PieceSelectionMode.INCLUDE_ALL
      : PieceSelectionMode.EXCLUDE_ALL,
    exceptions: knownPieceNames.filter((name) => !excluded.has(name)),
  };
}

function RequiredActionsCountBadge({ pieceSet }: { pieceSet: PieceSet }) {
  const { actionsInLatestPieceVersionCount: count } =
    useRequiredActionsGroupedByPiece({
      actions: pieceSet.config.requiredActions.actions,
    });
  if (count === 0) {
    return null;
  }
  return (
    <Badge variant="secondary" className="ml-2">
      {count}
    </Badge>
  );
}

PieceSetDetailsPage.displayName = 'PieceSetDetailsPage';
export { PieceSetDetailsPage };
