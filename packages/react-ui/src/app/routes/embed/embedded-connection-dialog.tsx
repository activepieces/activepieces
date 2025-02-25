import { useEffect, useRef, useState } from 'react';

import { parentWindow } from '@/lib/utils';
import {
  apId,
  AppConnectionWithoutSensitiveData,
  isNil,
} from '@activepieces/shared';
import {
  ActivepiecesClientConnectionNameIsInvalid,
  ActivepiecesClientConnectionPieceNotFound,
  ActivepiecesClientEventName,
  ActivepiecesNewConnectionDialogClosed,
  NEW_CONNECTION_QUERY_PARAMS,
} from 'ee-embed-sdk';

import { piecesHooks } from '../../../features/pieces/lib/pieces-hook';
import { LoadingScreen } from '../../components/loading-screen';
import { CreateOrEditConnectionDialog } from '../../connections/create-edit-connection-dialog';

const extractIdFromQueryParams = () => {
  const connectionName = new URLSearchParams(window.location.search).get(
    NEW_CONNECTION_QUERY_PARAMS.connectionName,
  );
  return isNil(connectionName) || connectionName.length === 0
    ? apId()
    : connectionName;
};
export const EmbeddedConnectionDialog = () => {
  const connectionName = extractIdFromQueryParams();
  const pieceName = new URLSearchParams(window.location.search).get(
    NEW_CONNECTION_QUERY_PARAMS.name,
  );
  const randomId = new URLSearchParams(window.location.search).get(
    NEW_CONNECTION_QUERY_PARAMS.randomId,
  );
  console.log(connectionName);
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

  if (isLoadingPiece) {
    return <LoadingScreen useDarkBackground={true} />;
  }

  if (!pieceModel) {
    return null;
  }

  return (
    <CreateOrEditConnectionDialog
      reconnectConnection={null}
      piece={pieceModel}
      externalIdComingFromSdk={connectionName}
      isGlobalConnection={false}
      open={isDialogOpen}
      key={`CreateOrEditConnectionDialog-open-${isDialogOpen}-${connectionName}}`}
      setOpen={(open, connection) => {
        setIsDialogOpen(open);
        if (!open) {
          hideConnectionIframe(connection);
        }
      }}
    />
  );
};
