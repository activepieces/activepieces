import { PieceSelection } from '@activepieces/shared';
import { t } from 'i18next';
import { ArrowLeft, Layers, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { pieceSetMutations, pieceSetQueries } from '@/features/piece-sets';
import { piecesHooks } from '@/features/pieces';
import { cn } from '@/lib/utils';

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
    mode: include ? 'include_all' : 'exclude_all',
    exceptions: knownPieceNames.filter((name) => !excluded.has(name)),
  };
}

const PieceSetDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  if (isLoading || !pieceSet) {
    return (
      <div className="flex items-center justify-center flex-1">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
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
              onClick={() => navigate('/platform/setup/pieces?tab=piece-sets')}
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
          'Configure which pieces and actions are available in this set',
        )}
      />

      <div className="mx-auto w-full flex flex-col flex-1 min-h-0 gap-0">
        <div className="px-4 pt-3 pb-6 shrink-0 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border bg-muted/40 px-3.5 py-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t('Assigned')}
              </span>
              <PieceSetProjectsDialog pieceSet={pieceSet} />
            </div>

            <div className="self-stretch w-px bg-border" />

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t('Auto-include')}
              </span>
              <AutoIncludePill
                label={t('New pieces')}
                checked={pieceSet.config.pieces.mode === 'include_all'}
                disabled={isPending || piecesLoading}
                onCheckedChange={handleToggle}
              />
            </div>

            <span className="text-xs text-muted-foreground">
              {t(
                'Applies only to pieces that don’t exist yet — actions are governed per piece below.',
              )}
            </span>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          <PieceSetPiecesTab pieceSet={pieceSet} />
        </div>
      </div>
    </>
  );
};

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
        'inline-flex h-8 cursor-pointer select-none items-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium transition-colors',
        checked && 'border-primary/50 bg-primary/[0.07] text-primary',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <Switch
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
