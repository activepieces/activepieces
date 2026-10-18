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
  isEnabled: boolean;
};

const PieceActions = ({ pieceName, isEnabled }: PieceActionsProps) => {
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
  const lockedOnCommunity = gate.access === 'community';
  const label = pinned ? t('Unpin this piece') : t('Pin this piece');

  return (
    <div className="flex gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={lockedOnCommunity ? 0 : undefined}
            role={lockedOnCommunity ? 'button' : undefined}
            aria-disabled={lockedOnCommunity ? true : undefined}
            aria-label={lockedOnCommunity ? label : undefined}
          >
            <Button
              {...adminControl(AdminControl.PIECES_PIN_RUN)}
              variant="ghost"
              size={'sm'}
              loading={isPinPending}
              disabled={lockedOnCommunity}
              aria-hidden={lockedOnCommunity ? true : undefined}
              aria-label={label}
              onClick={() => gate.run(() => togglePin(pieceName))}
            >
              {pinned ? (
                <PinOff className="size-4" />
              ) : (
                <Pin className="size-4" />
              )}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {lockedOnCommunity
            ? t('Contact sales to unlock pinning pieces')
            : label}
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

PieceActions.displayName = 'PieceActions';

export { PieceActions };
