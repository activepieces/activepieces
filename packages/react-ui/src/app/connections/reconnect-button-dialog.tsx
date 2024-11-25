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
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
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
          <p>{t('Reconnect')}</p>
        </TooltipContent>
      </Tooltip>
      {open && !isLoading && pieceModel && (
        <CreateOrEditConnectionDialog
          reconnectConnection={connection}
          isGlobalConnection={connection.scope === AppConnectionScope.PLATFORM}
          predefinedConnectionName={null}
          piece={pieceModel}
          onConnectionCreated={onConnectionCreated}
          open={open}
          setOpen={setOpen}
        />
      )}
    </>
  );
};

export { ReconnectButtonDialog };
