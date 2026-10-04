import {
  AppConnectionScope,
  AppConnectionWithoutSensitiveData,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Cable } from 'lucide-react';
import { useState } from 'react';

import { CreateOrEditConnectionDialog } from '@/app/connections/create-edit-connection-dialog';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { piecesHooks } from '@/features/pieces';

type ReconnectButtonDialogProps = {
  connection: AppConnectionWithoutSensitiveData;
  onConnectionCreated: () => void;
  hasPermission: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const ReconnectButtonDialog = ({
  connection,
  onConnectionCreated,
  hasPermission,
  open: controlledOpen,
  onOpenChange,
}: ReconnectButtonDialogProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(next);
    }
    onOpenChange?.(next);
  };
  const { pieceModel, isLoading } = piecesHooks.usePiece({
    name: connection.pieceName,
    version: connection.pieceVersion,
    enabled: open,
  });

  return (
    <>
      {!isControlled && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Button
                onClick={() => setOpen(true)}
                disabled={!hasPermission}
                variant={'ghost'}
              >
                <Cable className="h-4 w-4" />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {!hasPermission ? (
              <p>{t('Permission needed')}</p>
            ) : (
              <p>{t('Reconnect')}</p>
            )}
          </TooltipContent>
        </Tooltip>
      )}
      {open && !isLoading && pieceModel && (
        <CreateOrEditConnectionDialog
          reconnectConnection={connection}
          isGlobalConnection={connection.scope === AppConnectionScope.PLATFORM}
          piece={pieceModel}
          open={open}
          key={`CreateOrEditConnectionDialog-open-${open}`}
          setOpen={(open, connection) => {
            setOpen(open);
            if (connection) {
              onConnectionCreated();
            }
          }}
        />
      )}
    </>
  );
};

export { ReconnectButtonDialog };
