import { isNil } from '@activepieces/core-utils';
import {
  PopulatedRecord,
  TableRecordsChangedEvent,
  TableRecordsChangeOp,
  WebsocketClientEvent,
  WebsocketServerEvent,
} from '@activepieces/shared';
import { useEffect } from 'react';

import { useSocket } from '@/components/providers/socket-provider';
import { editorSession } from '@/lib/editor-session';
import { errorReporting } from '@/lib/error-reporting';

export function useTableRoom({
  tableId,
  onChange,
  onJoined,
}: {
  tableId: string;
  onChange: (change: TableChange) => void;
  onJoined: () => void;
}) {
  const socket = useSocket();
  useEffect(() => {
    const join = () => {
      socket
        .timeout(JOIN_TIMEOUT_MS)
        .emit(
          WebsocketServerEvent.JOIN_TABLE,
          { tableId },
          (error: Error | null) => {
            if (!isNil(error)) {
              errorReporting.report({ error, source: 'table-live-updates' });
              return;
            }
            onJoined();
          },
        );
    };
    const onRecordsChanged = (event: TableRecordsChangedEvent) => {
      if (
        event.tableId !== tableId ||
        event.editorSessionId === editorSession.getId()
      ) {
        return;
      }
      onChange(changeOf(event));
    };
    socket.on(WebsocketClientEvent.TABLE_RECORDS_CHANGED, onRecordsChanged);
    socket.on('connect', join);
    if (socket.connected) {
      join();
    }
    return () => {
      socket.off(WebsocketClientEvent.TABLE_RECORDS_CHANGED, onRecordsChanged);
      socket.off('connect', join);
      if (socket.connected) {
        socket.emit(WebsocketServerEvent.LEAVE_TABLE, { tableId });
      }
    };
  }, [socket, tableId, onChange, onJoined]);
}

function changeOf(event: TableRecordsChangedEvent): TableChange {
  switch (event.op) {
    case TableRecordsChangeOp.CREATED:
    case TableRecordsChangeOp.UPDATED:
      return { type: 'rows', records: event.records, removedIds: [] };
    case TableRecordsChangeOp.DELETED:
      return { type: 'rows', records: [], removedIds: event.recordIds };
    case TableRecordsChangeOp.CLEARED:
      return { type: 'cleared' };
    case TableRecordsChangeOp.RELOAD:
      return { type: 'reload', scope: 'records' };
    case TableRecordsChangeOp.FIELDS_CHANGED:
      return { type: 'reload', scope: 'fields' };
  }
}

const JOIN_TIMEOUT_MS = 10_000;

export type TableChange =
  | { type: 'rows'; records: PopulatedRecord[]; removedIds: string[] }
  | { type: 'cleared' }
  | { type: 'reload'; scope: 'records' | 'fields' };
