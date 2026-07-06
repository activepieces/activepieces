import { t } from 'i18next';
import { Eye, EyeOff, Pin, PinOff, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  platformPiecesMutations,
  platformPieceFilterQueries,
} from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';
import { cn } from '@/lib/utils';

import { PieceComponentVisibilitySheet } from './piece-component-visibility-sheet';

type PieceActionsProps = {
  pieceName: string;
  pieceDisplayName: string;
  isEnabled: boolean;
  isHidden: boolean;
};

const PieceActions = ({
  pieceName,
  pieceDisplayName,
  isEnabled,
  isHidden,
}: PieceActionsProps) => {
  const { platform, refetch } = platformHooks.useCurrentPlatform();
  const { pieceFilter } = platformPieceFilterQueries.usePlatformPieceFilter();
  const [sheetOpen, setSheetOpen] = useState(false);

  const { mutate: togglePiece, isPending: isTogglePending } =
    platformPiecesMutations.useTogglePieceVisibility({
      filteredPieceNames: pieceFilter.filteredPieceNames,
    });
  const { mutate: togglePin, isPending: isPinPending } =
    platformPiecesMutations.useTogglePiecePin({
      platformId: platform.id,
      pinnedPieces: platform.pinnedPieces,
      refetch,
    });

  const filtered = pieceFilter.filteredPieceNames.includes(pieceName);
  const pinned = platform.pinnedPieces.includes(pieceName);
  const hasComponentFilters =
    (pieceFilter.filteredActionNames[pieceName]?.length ?? 0) > 0 ||
    (pieceFilter.filteredTriggerNames[pieceName]?.length ?? 0) > 0;

  return (
    <>
      <div className="flex gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size={'sm'}
              loading={isTogglePending}
              disabled={!isEnabled}
              onClick={(e) => {
                if (!isEnabled) {
                  e.preventDefault();
                  return;
                }
                togglePiece(pieceName);
              }}
            >
              {filtered ? (
                <Eye className="size-4 text-primary" />
              ) : (
                <EyeOff className="size-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {filtered
              ? t('Show this piece for all projects')
              : t('Hide this piece from all projects')}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size={'sm'}
              loading={isPinPending}
              disabled={!isEnabled || isHidden}
              onClick={(e) => {
                if (!isEnabled || isHidden) {
                  e.preventDefault();
                  return;
                }
                togglePin(pieceName);
              }}
            >
              {pinned ? (
                <PinOff className="size-4" />
              ) : (
                <Pin className="size-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {pinned ? t('Unpin this piece') : t('Pin this piece')}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size={'sm'}
              disabled={!isEnabled || filtered}
              onClick={(e) => {
                if (!isEnabled || filtered) {
                  e.preventDefault();
                  return;
                }
                setSheetOpen(true);
              }}
            >
              <SlidersHorizontal
                className={cn('size-4', hasComponentFilters && 'text-primary')}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('Manage actions & triggers')}</TooltipContent>
        </Tooltip>
      </div>
      <PieceComponentVisibilitySheet
        pieceName={pieceName}
        pieceDisplayName={pieceDisplayName}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  );
};

PieceActions.displayName = 'PieceActions';

export { PieceActions };
