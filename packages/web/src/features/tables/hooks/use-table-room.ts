import { WebsocketServerEvent } from '@activepieces/shared';
import { useEffect } from 'react';

import {
  emitInProject,
  useSocket,
} from '@/components/providers/socket-provider';

export function useTableRoom({ tableId }: { tableId: string }): void {
  const socket = useSocket();
  useEffect(() => {
    const join = () =>
      emitInProject(() =>
        socket.emit(WebsocketServerEvent.JOIN_TABLE_ROOM, { tableId }),
      );
    join();
    socket.on('connect', join);
    return () => {
      socket.off('connect', join);
      socket.emit(WebsocketServerEvent.LEAVE_TABLE_ROOM, { tableId });
    };
  }, [socket, tableId]);
}
