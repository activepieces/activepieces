import { useEffect, useRef, useState } from 'react';

import { memoryRouter } from '@/app/router';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/ui/spinner';
import { cn, parentWindow } from '@/lib/utils';
import {
  apId,
  AppConnectionWithoutSensitiveData,
  isNil,
} from '@activepieces/shared';
import {
  ActivepiecesClientConnectionNameIsInvalid,
  ActivepiecesClientConnectionPieceNotFound,
  ActivepiecesClientEventName,
  ActivepiecesClientShowConnectionIframe,
  ActivepiecesNewConnectionDialogClosed,
  NEW_CONNECTION_QUERY_PARAMS,
} from 'ee-embed-sdk';

import { piecesHooks } from '../../../features/pieces/lib/pieces-hooks';
import { CreateOrEditConnectionDialogContent } from '../../connections/create-edit-connection-dialog';

const extractIdFromQueryParams = () => {
  const connectionName = new URLSearchParams(
    memoryRouter.state.location.search,
  ).get(NEW_CONNECTION_QUERY_PARAMS.connectionName);
  return isNil(connectionName) || connectionName.length === 0
    ? apId()
    : connectionName;
};
export const EmbeddedConnectionDialog = () => {
  const connectionName = extractIdFromQueryParams();
  const queryParams = new URLSearchParams(memoryRouter.state.location.search);
  const pieceName = queryParams.get(NEW_CONNECTION_QUERY_PARAMS.name);
  const randomId = queryParams.get(NEW_CONNECTION_QUERY_PARAMS.randomId);
  return (
    <EmbeddedConnectionDialogContent
      connectionName={
        connectionName && connectionName.length > 0 ? connectionName : null
      }
      pieceName={pieceName}
      key={randomId}
    ></EmbeddedConnectionDialogContent>
  );
};

type EmbeddedConnectionDialogContentProps = {
  pieceName: string | null;
  connectionName: string | null;
};

const EmbeddedConnectionDialogContent = ({
  pieceName,
  connectionName,
}: EmbeddedConnectionDialogContentProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(true);
  const hasErrorRef = useRef(false);

  const {
    pieceModel,
    isLoading: isLoadingPiece,
    isSuccess,
  } = piecesHooks.usePiece({
    name: pieceName ?? '',
  });
  const hideConnectionIframe = (
    connection?: Pick<AppConnectionWithoutSensitiveData, 'id' | 'externalId'>,
  ) => {
    postMessageToParent({
      type: ActivepiecesClientEventName.CLIENT_NEW_CONNECTION_DIALOG_CLOSED,
      data: {
        connection: connection
          ? {
              id: connection.id,
              name: connection.externalId,
            }
          : undefined,
      },
    });
  };

  const postMessageToParent = (
    event:
      | ActivepiecesNewConnectionDialogClosed
      | ActivepiecesClientConnectionNameIsInvalid
      | ActivepiecesClientConnectionPieceNotFound,
  ) => {
    parentWindow.postMessage(event, '*');
  };
  useEffect(() => {
    const showConnectionIframeEvent: ActivepiecesClientShowConnectionIframe = {
      type: ActivepiecesClientEventName.CLIENT_SHOW_CONNECTION_IFRAME,
      data: {},
    };
    parentWindow.postMessage(showConnectionIframeEvent, '*');
    document.body.style.background = 'transparent';
  }, []);

  useEffect(() => {
    if (!isSuccess && !isLoadingPiece && !hasErrorRef.current) {
      postMessageToParent({
        type: ActivepiecesClientEventName.CLIENT_CONNECTION_PIECE_NOT_FOUND,
        data: {
          error: JSON.stringify({
            isValid: 'false',
            error: `piece: ${pieceName} not found`,
          }),
        },
      });
      hideConnectionIframe();
      hasErrorRef.current = true;
    }
  }, [isSuccess, isLoadingPiece, pieceName]);

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          hideConnectionIframe();
        }
      }}
    >
      <DialogContent
        showOverlay={false}
        onInteractOutside={(e) => e.preventDefault()}
        className={cn(
          'max-h-[70vh]  min-w-[450px] max-w-[450px] lg:min-w-[650px] lg:max-w-[650px] overflow-y-auto',
          {
            '!bg-transparent !border-none focus:outline-none !border-transparent !shadow-none':
              isLoadingPiece,
          },
        )}
        withCloseButton={!isLoadingPiece}
      >
        {isLoadingPiece && (
          <div className="flex justify-center items-center">
            <LoadingSpinner className="stroke-background size-[50px]"></LoadingSpinner>
          </div>
        )}

        {!isLoadingPiece && pieceModel && (
          <CreateOrEditConnectionDialogContent
            reconnectConnection={null}
            piece={pieceModel}
            externalIdComingFromSdk={connectionName}
            isGlobalConnection={false}
            setOpen={(open, connection) => {
              if (!open) {
                hideConnectionIframe(connection);
              }
              setIsDialogOpen(open);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
