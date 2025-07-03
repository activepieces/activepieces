import { t } from 'i18next';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';

import { CreateOrEditConnectionDialog } from '@/app/connections/create-edit-connection-dialog';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { piecesHooks } from '@/features/pieces/lib/pieces-hooks';
import {
  AppConnectionScope,
  AppConnectionWithoutSensitiveData,
} from '@activepieces/shared';

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
  const { pieceModel, isLoading } = piecesHooks.usePiece({
    name: connection.pieceName,
  });

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => setOpen(true)}
            disabled={!hasPermission}
            variant={'ghost'}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {!hasPermission ? (
            <p>{t('Permission needed')}</p>
          ) : (
            <p>{t('Reconnect')}</p>
          )}
        </TooltipContent>
      </Tooltip>
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
