import { useEffect, useRef, useState } from 'react';

import { parentWindow } from '@/lib/utils';
import { AppConnectionWithoutSensitiveData } from '@activepieces/shared';
import {
  ActivepiecesClientConnectionNameIsInvalid,
  ActivepiecesClientConnectionPieceNotFound,
  ActivepiecesClientEventName,
  ActivepiecesNewConnectionDialogClosed,
  NEW_CONNECTION_QUERY_PARAMS,
} from 'ee-embed-sdk';

import { appConnectionsHooks } from '../../../features/connections/lib/app-connections-hooks';
import { piecesHooks } from '../../../features/pieces/lib/pieces-hook';
import { LoadingScreen } from '../../components/loading-screen';
import { CreateOrEditConnectionDialog } from '../../connections/create-edit-connection-dialog';

export const EmbeddedConnectionDialog = () => {
  const connectionName = new URLSearchParams(window.location.search).get(
    NEW_CONNECTION_QUERY_PARAMS.connectionName,
  );

  const pieceName = new URLSearchParams(window.location.search).get(
    NEW_CONNECTION_QUERY_PARAMS.name,
  );
  const randomId = new URLSearchParams(window.location.search).get(
    NEW_CONNECTION_QUERY_PARAMS.randomId,
  );

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
  const [predefinedConnection, setPredefinedConnection] =
    useState<AppConnectionWithoutSensitiveData | null>(null);
  const { data: connections, isLoading: isLoadingConnections } =
    appConnectionsHooks.useConnections({});
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

  const validateConnectionName = (
    connectionExternalId: string,
    existingConnections: AppConnectionWithoutSensitiveData[],
  ): { isValid: boolean; error?: string } => {
    const isConnectionNameUsed = existingConnections.some(
      (c) => c.externalId === connectionExternalId,
    );

    if (!isConnectionNameUsed) {
      return {
        isValid: false,
        error: `There is no connection with this externalId: ${connectionExternalId}`,
      };
    }
    return { isValid: true };
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

  useEffect(() => {
    if (connectionName && connections && !hasErrorRef.current) {
      const validationResult = validateConnectionName(
        connectionName,
        connections,
      );
      setPredefinedConnection(
        connections.find((c) => c.externalId === connectionName) ?? null,
      );
      if (!validationResult.isValid) {
        postMessageToParent({
          type: ActivepiecesClientEventName.CLIENT_CONNECTION_NAME_IS_INVALID,
          data: { error: JSON.stringify(validationResult) },
        });
        hideConnectionIframe();
        hasErrorRef.current = true;
      }
    }
  }, [connectionName, connections]);

  if (isLoadingPiece || isLoadingConnections) {
    return <LoadingScreen useDarkBackground={true} />;
  }

  if (!pieceModel) {
    return null;
  }

  return (
    <CreateOrEditConnectionDialog
      reconnectConnection={predefinedConnection}
      piece={pieceModel}
      isGlobalConnection={false}
      open={isDialogOpen}
      key={`CreateOrEditConnectionDialog-open-${isDialogOpen}-${predefinedConnection?.id}`}
      setOpen={(open, connection) => {
        setIsDialogOpen(open);
        if (!open) {
          hideConnectionIframe(connection);
        }
      }}
    />
  );
};
