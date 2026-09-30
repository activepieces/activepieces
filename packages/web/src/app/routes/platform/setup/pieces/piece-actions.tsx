import { t } from 'i18next';
import { Pin, PinOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { platformPiecesMutations } from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';

type PieceActionsProps = {
  pieceName: string;
  isEnabled: boolean;
};

const PieceActions = ({ pieceName, isEnabled }: PieceActionsProps) => {
  const { platform, refetch } = platformHooks.useCurrentPlatform();

  const { mutate: togglePin, isPending: isPinPending } =
    platformPiecesMutations.useTogglePiecePin({
      platformId: platform.id,
      pinnedPieces: platform.pinnedPieces,
      refetch,
    });

  const pinned = platform.pinnedPieces.includes(pieceName);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          loading={isPinPending}
          disabled={!isEnabled}
          onClick={(e) => {
            if (!isEnabled) {
              e.preventDefault();
              return;
            }
            togglePin(pieceName);
          }}
        >
          {pinned ? <PinOff /> : <Pin />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {pinned ? t('Unpin this piece') : t('Pin this piece')}
      </TooltipContent>
    </Tooltip>
  );
};

PieceActions.displayName = 'PieceActions';

export { PieceActions };
