import {
  FlowActionType,
  isCoreStepVisible,
  PieceSelection,
  PieceSelectionMode,
  PieceSetConfig,
} from '@activepieces/shared';
import { t } from 'i18next';
import { ArrowLeft, Info, Layers, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
    mode: include
      ? PieceSelectionMode.INCLUDE_ALL
      : PieceSelectionMode.EXCLUDE_ALL,
    exceptions: knownPieceNames.filter((name) => !excluded.has(name)),
  };
}

function setCoreStepVisible({
  config,
  type,
  visible,
}: {
  config: PieceSetConfig;
  type: FlowActionType;
  visible: boolean;
}): FlowActionType[] {
  const hidden = config.hiddenCoreSteps ?? [];
  return visible ? hidden.filter((step) => step !== type) : [...hidden, type];
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

  const handleCodeToggle = (visible: boolean) => {
    if (!pieceSet) return;
    updateSet({
      id: pieceSet.id,
      request: {
        hiddenCoreSteps: setCoreStepVisible({
          config: pieceSet.config,
          type: FlowActionType.CODE,
          visible,
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
        <div className="px-4 pt-3 pb-6 shrink-0">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border bg-muted/40 px-3.5 py-2.5">
            <PieceSetProjectsDialog pieceSet={pieceSet} />

            <Separator orientation="vertical" className="h-5" />

            <SettingToggle
              label={t('Auto-include new pieces')}
              hint={t(
                'Applies only to pieces that don’t exist yet — actions are governed per piece below.',
              )}
              checked={
                pieceSet.config.pieces.mode === PieceSelectionMode.INCLUDE_ALL
              }
              disabled={isPending || piecesLoading}
              onCheckedChange={handleToggle}
            />

            <SettingToggle
              label={t('Code step')}
              checked={isCoreStepVisible({
                config: pieceSet.config,
                type: FlowActionType.CODE,
              })}
              disabled={isPending}
              onCheckedChange={handleCodeToggle}
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          <PieceSetPiecesTab pieceSet={pieceSet} />
        </div>
      </div>
    </>
  );
};

function SettingToggle({
  label,
  hint,
  checked,
  disabled,
  onCheckedChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  disabled: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <label
        className={cn(
          'flex cursor-pointer select-none items-center gap-2 text-sm',
          disabled && 'pointer-events-none opacity-50',
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
      {hint && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="size-4 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">{hint}</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

PieceSetDetailsPage.displayName = 'PieceSetDetailsPage';
export { PieceSetDetailsPage };
