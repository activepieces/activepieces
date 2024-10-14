import { useRef, useState } from 'react';

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

export const EmbeddedConnectionDialogWrapper = () => {
  const connectionName = new URLSearchParams(window.location.search).get(
    NEW_CONNECTION_QUERY_PARAMS.connectionName,
  );

  const pieceName = new URLSearchParams(window.location.search).get(
    NEW_CONNECTION_QUERY_PARAMS.name,
  );
  const date = new URLSearchParams(window.location.search).get(
    NEW_CONNECTION_QUERY_PARAMS.date,
  );

  return (
    <EmbeddedConnectionDialog
      connectionName={
        connectionName && connectionName.length > 0 ? connectionName : null
      }
      pieceName={pieceName}
      key={date}
    ></EmbeddedConnectionDialog>
  );
};

const EmbeddedConnectionDialog = ({
  pieceName,
  connectionName,
}: {
  connectionName: string | null;
  pieceName: string | null;
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(true);
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
    connection?: Pick<AppConnectionWithoutSensitiveData, 'id' | 'name'>,
  ) => {
    const newConnectionDialogClosedEvent: ActivepiecesNewConnectionDialogClosed =
      {
        data: {
          connection,
        },
        type: ActivepiecesClientEventName.CLIENT_NEW_CONNECTION_DIALOG_CLOSED,
      };
    window.parent.postMessage(newConnectionDialogClosedEvent, '*');
  };

  if (!isSuccess && !isLoadingPiece && !hasErrorRef.current) {
    const connectionNameIsInvalidEvent: ActivepiecesClientConnectionNameIsInvalid =
      {
        data: {
          error: JSON.stringify({
            isValid: 'false',
            error: `piece: ${pieceName} not found`,
          }),
        },
        type: ActivepiecesClientEventName.CLIENT_CONNECTION_NAME_IS_INVALID,
      };
    window.parent.postMessage(connectionNameIsInvalidEvent, '*');
    hideConnectionIframe();
    hasErrorRef.current = true;
  }
  if (connectionName && connections && !hasErrorRef.current) {
    const regex = new RegExp(`^${connectionNameRegex}$`);
    const isConnectionNameUsed = !!connections.data.find(
      (c) => c.name === connectionName,
    );
    const error = isConnectionNameUsed
      ? {
          isValid: false,
          error: 'Connection name is already used',
        }
      : !regex.test(connectionName)
      ? {
          isValid: false,
          error: `Connection name must match the following regex ${connectionNameRegex}`,
        }
      : null;
    if (error) {
      const connectionNameIsInvalidEvent: ActivepiecesClientConnectionNameIsInvalid =
        {
          data: {
            error: JSON.stringify(error),
          },
          type: ActivepiecesClientEventName.CLIENT_CONNECTION_NAME_IS_INVALID,
        };
      window.parent.postMessage(connectionNameIsInvalidEvent, '*');
      hideConnectionIframe();
      hasErrorRef.current = true;
    }
  }

  return (
    <>
      {(isLoadingPiece || isLoadingConnections) && (
        <LoadingScreen></LoadingScreen>
      )}
      {pieceModel && (
        <CreateOrEditConnectionDialog
          reconnectConnection={null}
          predefinedConnectionName={connectionName}
          piece={pieceModel}
          open={isDialogOpen}
          onConnectionCreated={hideConnectionIframe}
          setOpen={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              hideConnectionIframe();
            }
          }}
        ></CreateOrEditConnectionDialog>
      )}
    </>
  );
};
