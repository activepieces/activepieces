import { PieceSelection, PieceSelectionMode } from '@activepieces/shared';
import { t } from 'i18next';
import { Loader2 } from 'lucide-react';
import { Navigate, useParams } from 'react-router-dom';

import { Page, PageHeader } from '@/components/custom/page';
import { Panel, SettingRow, SettingRows } from '@/components/custom/panel';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { pieceSetMutations, pieceSetQueries } from '@/features/piece-sets';
import { piecesHooks } from '@/features/pieces';
import { platformHooks } from '@/hooks/platform-hooks';

import { PieceSetPiecesTab } from './piece-set-pieces-tab';
import { PieceSetProjectsDialog } from './piece-set-projects-dialog';

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

const PieceSetDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: pieceSet, isLoading } = pieceSetQueries.usePieceSet(id ?? '');
  const { pieces, isLoading: piecesLoading } = piecesHooks.usePieces({
    includeHidden: true,
    isTableQuery: true,
    skipProjectFilter: true,
  });
  const { mutate: updateSet, isPending } =
    pieceSetMutations.useUpdatePieceSet();

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
    <Page fill>
      <PageHeader
        back={{ to: '/platform/pieces/piece-sets', label: t('Back') }}
        title={
          <span className="flex items-center gap-3">
            <span className="min-w-0 truncate">{pieceSet.name}</span>
            {pieceSet.isDefault && (
              <Badge variant="secondary">{t('Default')}</Badge>
            )}
          </span>
        }
        description={t(
          'Configure which pieces and actions are available in this set',
        )}
      />
      <Panel flush>
        <SettingRows>
          <SettingRow title={t('Assigned')}>
            <PieceSetProjectsDialog pieceSet={pieceSet} />
          </SettingRow>
          <SettingRow
            title={t('Auto-include')}
            description={t(
              'Applies only to pieces that don’t exist yet — actions are governed per piece below.',
            )}
          >
            <label className="flex cursor-pointer items-center gap-3 text-sm text-gray-11">
              {t('New pieces')}
              <Switch
                checked={
                  pieceSet.config.pieces.mode === PieceSelectionMode.INCLUDE_ALL
                }
                disabled={isPending || piecesLoading}
                onCheckedChange={handleToggle}
              />
            </label>
          </SettingRow>
        </SettingRows>
      </Panel>
      <PieceSetPiecesTab pieceSet={pieceSet} />
    </Page>
  );
};

PieceSetDetailsPage.displayName = 'PieceSetDetailsPage';
export { PieceSetDetailsPage };
