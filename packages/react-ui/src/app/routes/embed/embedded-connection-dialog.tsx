import { useEffect, useRef, useState } from 'react';

import { AppConnectionWithoutSensitiveData } from '@activepieces/shared';
import {
  ActivepiecesClientConnectionNameIsInvalid,
  ActivepiecesClientEventName,
  ActivepiecesNewConnectionDialogClosed,
  connectionNameRegex,
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
      | ActivepiecesClientConnectionNameIsInvalid,
  ) => {
    window.parent.postMessage(event, '*');
  };

  const validateConnectionName = (
    connectionName: string,
    existingConnections: AppConnectionWithoutSensitiveData[],
  ): { isValid: boolean; error?: string } => {
    const regex = new RegExp(`^${connectionNameRegex}$`);
    const isConnectionNameUsed = existingConnections.some(
      (c) => c.externalId === connectionName,
    );

    if (isConnectionNameUsed) {
      return { isValid: false, error: 'Connection name is already used' };
    }

    if (!regex.test(connectionName)) {
      return {
        isValid: false,
        error: `Connection name must match the following regex ${connectionNameRegex}`,
      };
    }

    return { isValid: true };
  };

  useEffect(() => {
    if (!isSuccess && !isLoadingPiece && !hasErrorRef.current) {
      postMessageToParent({
        type: ActivepiecesClientEventName.CLIENT_CONNECTION_NAME_IS_INVALID,
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
    return <LoadingScreen />;
  }

  if (!pieceModel) {
    return null;
  }

  return (
    <CreateOrEditConnectionDialog
      reconnectConnection={null}
      predefinedConnectionName={connectionName}
      piece={pieceModel}
      isGlobalConnection={false}
      open={isDialogOpen}
      onConnectionCreated={hideConnectionIframe}
      setOpen={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          hideConnectionIframe();
        }
      }}
    />
  );
};
