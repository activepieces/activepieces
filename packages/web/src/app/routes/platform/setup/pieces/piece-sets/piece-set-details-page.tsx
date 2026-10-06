import {
  PieceSelection,
  PieceSelectionMode,
  PieceSet,
} from '@activepieces/shared';
import { t } from 'i18next';
import { ArrowLeft, Layers, Loader2 } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { pieceSetMutations, pieceSetQueries } from '@/features/piece-sets';
import { piecesHooks } from '@/features/pieces';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { cn, DASHBOARD_CONTENT_PADDING_X } from '@/lib/utils';

import { PieceSetPiecesTable } from './piece-set-pieces-table';
import { PieceSetProjectsDialog } from './piece-set-projects-dialog';
import { RequiredActionsTab } from './required-actions-tab';
import { useRequiredActionsGroupedByPiece } from './use-required-actions-grouped-by-piece';

const PieceSetDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: pieceSet, isLoading } = pieceSetQueries.usePieceSet(id ?? '');
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

  if (isLoading || !pieceSet) {
    return (
      <div className="flex items-center justify-center flex-1">
        <Loader2 className="size-6 animate-spin text-gray-11" />
      </div>
    );
  }

  return (
    <>
      <DashboardPageHeader
        title={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/platform/pieces/piece-sets')}
              className="p-1 h-auto"
            >
              <ArrowLeft className="size-4" />
            </Button>
            <Layers className="size-5" />
            <span>{pieceSet.name}</span>
            {pieceSet.isDefault && (
              <Badge variant="secondary">{t('Default')}</Badge>
            )}
          </div>
        }
        description={t(
          'Determine which actions and triggers assigned projects can add to their flows.',
        )}
      />

      <Tabs
        defaultValue="pieces"
        className="mx-auto w-full flex flex-col flex-1 min-h-0 gap-0"
      >
        <div className={cn('pt-3 shrink-0', DASHBOARD_CONTENT_PADDING_X)}>
          <TabsList
            variant="outline"
            className="w-full justify-start border-b border-gray-6"
          >
            <TabsTrigger variant="outline" value="pieces">
              {t('Pieces')}
            </TabsTrigger>
            <TabsTrigger variant="outline" value="requiredActions">
              {t('Required actions')}
              <RequiredActionsCountBadge pieceSet={pieceSet} />
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="pieces"
          className="flex-1 min-h-0 flex flex-col data-[state=inactive]:hidden mt-0"
        >
          <div className="p-4 pb-0 shrink-0 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border bg-gray-3/40 px-3.5 py-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">{t('Assigned')}</span>
                <PieceSetProjectsDialog pieceSet={pieceSet} />
              </div>

              <div className="self-stretch w-px bg-gray-6" />

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">
                  {t('Auto-Include')}
                </span>
                <AutoIncludePill
                  label={t('New pieces')}
                  checked={
                    pieceSet.config.pieces.mode ===
                    PieceSelectionMode.INCLUDE_ALL
                  }
                  disabled={piecesLoading}
                  onCheckedChange={handleToggle}
                />
              </div>

              <span className="text-xs text-gray-11">
                {t(
                  'Applies only to pieces that don’t exist yet — actions are governed per piece below.',
                )}
              </span>
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col">
            <PieceSetPiecesTable pieceSet={pieceSet} />
          </div>
        </TabsContent>

        <TabsContent
          value="requiredActions"
          className="flex-1 min-h-0 flex flex-col data-[state=inactive]:hidden"
        >
          <RequiredActionsTab pieceSet={pieceSet} />
        </TabsContent>
      </Tabs>
    </>
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

function AutoIncludePill({
  label,
  checked,
  disabled,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <label
      className={cn(
        'inline-flex h-8 cursor-pointer select-none items-center gap-2 rounded-lg border bg-gray-1 px-3 text-sm font-medium transition-colors',
        checked && 'border-accent-7 bg-accent-3 text-accent-11',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <Switch
        {...adminControl(AdminControl.PIECE_SETS_NEW_PIECES_TOGGLE)}
        size="sm"
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
      {label}
    </label>
  );
}

PieceSetDetailsPage.displayName = 'PieceSetDetailsPage';
export { PieceSetDetailsPage };
