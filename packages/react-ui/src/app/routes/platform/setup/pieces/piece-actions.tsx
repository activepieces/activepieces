import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Eye, EyeOff, Pin, PinOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { platformHooks } from '@/hooks/platform-hooks';
import { platformApi } from '@/lib/platforms-api';

type PieceActionsProps = {
  pieceName: string;
};

const PieceActions = ({ pieceName }: PieceActionsProps) => {
  const { platform, refetch } = platformHooks.useCurrentPlatform();

  const { mutate: togglePiece, isPending: isTogglePending } = useMutation({
    mutationFn: async (piecename: string) => {
      const newFilteredPieceNames = platform.filteredPieceNames.includes(
        piecename,
      )
        ? platform.filteredPieceNames.filter((name) => name !== piecename)
        : [...platform.filteredPieceNames, piecename];

      await platformApi.update(
        {
          filteredPieceNames: newFilteredPieceNames,
        },
        platform.id,
      );
      await refetch();
    },
    onSuccess: () => {
      toast({
        title: t('Success'),
        description: t('Your changes have been saved.'),
        duration: 3000,
      });
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  const { mutate: togglePin, isPending: isPinPending } = useMutation({
    mutationFn: async (piecename: string) => {
      const newPinnedPieces = platform.pinnedPieces.includes(piecename)
        ? platform.pinnedPieces.filter((name) => name !== piecename)
        : [...platform.pinnedPieces, piecename];

      await platformApi.update(
        {
          pinnedPieces: newPinnedPieces,
        },
        platform.id,
      );
      await refetch();
    },
    onSuccess: () => {
      toast({
        title: t('Success'),
        description: t('Your changes have been saved.'),
        duration: 3000,
      });
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  const filtered = platform.filteredPieceNames.includes(pieceName);
  const pinned = platform.pinnedPieces.includes(pieceName);

  return (
    <div className="flex gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size={'sm'}
            loading={isTogglePending}
            onClick={() => togglePiece(pieceName)}
          >
            {filtered ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {filtered
            ? t('Hide this piece from all projects')
            : t('Show this piece for all projects')}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size={'sm'}
            loading={isPinPending}
            onClick={() => togglePin(pieceName)}
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
    </div>
  );
};

PieceActions.displayName = 'PieceActions';

export { PieceActions };
