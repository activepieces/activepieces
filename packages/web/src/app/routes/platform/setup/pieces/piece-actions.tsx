import { t } from 'i18next';
import { Pin, PinOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useEnterpriseGate } from '@/features/billing';
import { platformPiecesMutations } from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';

type PieceActionsProps = {
  pieceName: string;
  displayName: string;
  isEnabled: boolean;
};

const PieceActions = ({
  pieceName,
  displayName,
  isEnabled,
}: PieceActionsProps) => {
  const { platform, refetch } = platformHooks.useCurrentPlatform();
  const gate = useEnterpriseGate({
    unlocked: isEnabled,
    featureKey: 'PIECES',
  });

  const { mutateAsync: togglePin, isPending: isPinPending } =
    platformPiecesMutations.useTogglePiecePin({
      platformId: platform.id,
      pinnedPieces: platform.pinnedPieces,
      refetch,
    });

  const pinned = platform.pinnedPieces.includes(pieceName);

  return (
    <div className="flex gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            {...adminControl(AdminControl.PIECES_PIN_RUN)}
            variant="ghost"
            size={'sm'}
            loading={isPinPending}
            disabled={gate.access === 'community'}
            aria-label={pinned ? t('Unpin this piece') : t('Pin this piece')}
            onClick={() =>
              gate.run(() => togglePin({ pieceName, displayName }))
            }
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
