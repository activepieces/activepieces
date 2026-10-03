import { apId, isNil } from '@activepieces/core-utils';
import { AppConnectionWithoutSensitiveData } from '@activepieces/shared';
import {
  ActivepiecesClientConnectionNameIsInvalid,
  ActivepiecesClientConnectionPieceNotFound,
  ActivepiecesClientEventName,
  ActivepiecesClientShowConnectionIframe,
  ActivepiecesNewConnectionDialogClosed,
  NEW_CONNECTION_QUERY_PARAMS,
} from 'ee-embed-sdk';
import { useEffect, useRef, useState } from 'react';

import { memoryRouter } from '@/app/guards';
import { LoadingSpinner } from '@/components/custom/spinner';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { oauthAppsQueries } from '@/features/connections';
import { piecesHooks } from '@/features/pieces';
import { parentWindow } from '@/lib/dom-utils';
import { cn } from '@/lib/utils';

import { CreateOrEditConnectionDialogContent } from '../../connections/create-edit-connection-dialog';

export const EmbeddedConnectionDialog = () => {
  const queryParams = new URLSearchParams(memoryRouter.state.location.search);
  const requestedConnectionName = queryParams.get(
    NEW_CONNECTION_QUERY_PARAMS.connectionName,
  );
  const existingConnectionName =
    isNil(requestedConnectionName) || requestedConnectionName.length === 0
      ? null
      : requestedConnectionName;
  const pieceName = queryParams.get(NEW_CONNECTION_QUERY_PARAMS.name);
  const randomId = queryParams.get(NEW_CONNECTION_QUERY_PARAMS.randomId);
  return (
    <EmbeddedConnectionDialogContent
      connectionName={existingConnectionName ?? apId()}
      existingConnectionName={existingConnectionName}
      pieceName={pieceName}
      key={randomId}
    ></EmbeddedConnectionDialogContent>
  );
};

type EmbeddedConnectionDialogContentProps = {
  pieceName: string | null;
  connectionName: string;
  existingConnectionName: string | null;
};

const EmbeddedConnectionDialogContent = ({
  pieceName,
  connectionName,
  existingConnectionName,
}: EmbeddedConnectionDialogContentProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(true);
  const hasErrorRef = useRef(false);

  const {
    data: pieceModel,
    isLoading: isLoadingPiece,
    isSuccess,
  } = piecesHooks.usePieceForEmbeddingConnection({
    pieceName: pieceName ?? '',
    connectionExternalId: existingConnectionName,
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

  const { data: piecesOAuth2AppsMap, isPending: loadingPiecesOAuth2AppsMap } =
    oauthAppsQueries.usePiecesOAuth2AppsMap();
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
            'bg-transparent! border-none! focus:outline-hidden border-transparent! shadow-none!':
              isLoadingPiece,
          },
        )}
        showCloseButton={!isLoadingPiece}
      >
        {isLoadingPiece ||
          (loadingPiecesOAuth2AppsMap && (
            <div className="flex justify-center items-center">
              <LoadingSpinner className="stroke-background size-[50px]"></LoadingSpinner>
            </div>
          ))}

        {!isLoadingPiece && pieceModel && piecesOAuth2AppsMap && (
          <CreateOrEditConnectionDialogContent
            reconnectConnection={null}
            piecesOAuth2AppsMap={piecesOAuth2AppsMap}
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
