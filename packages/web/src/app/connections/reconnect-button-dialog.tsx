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
};

const ReconnectButtonDialog = ({
  connection,
  onConnectionCreated,
  hasPermission,
}: ReconnectButtonDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
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
      <ReconnectConnectionDialog
        connection={connection}
        open={open}
        onOpenChange={setOpen}
        onConnectionCreated={onConnectionCreated}
      />
    </>
  );
};

const ReconnectConnectionDialog = ({
  connection,
  open,
  onOpenChange,
  onConnectionCreated,
}: ReconnectConnectionDialogProps) => {
  const { pieceModel, isLoading } = piecesHooks.usePiece({
    name: connection.pieceName,
    version: connection.pieceVersion,
    enabled: open,
  });

  if (!open || isLoading || !pieceModel) {
    return null;
  }

  return (
    <CreateOrEditConnectionDialog
      reconnectConnection={connection}
      isGlobalConnection={connection.scope === AppConnectionScope.PLATFORM}
      piece={pieceModel}
      open={open}
      key={`CreateOrEditConnectionDialog-open-${open}`}
      setOpen={(open, connection) => {
        onOpenChange(open);
        if (connection) {
          onConnectionCreated();
        }
      }}
    />
  );
};

type ReconnectConnectionDialogProps = {
  connection: AppConnectionWithoutSensitiveData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnectionCreated: () => void;
};

export { ReconnectButtonDialog, ReconnectConnectionDialog };
