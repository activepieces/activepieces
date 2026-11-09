import { isNil } from '@activepieces/core-utils';
import {
  JoinTableRoomResponse,
  PopulatedRecord,
  TableRecordsChangedEvent,
  TableRecordsChangeOp,
  WebsocketClientEvent,
  WebsocketServerEvent,
} from '@activepieces/shared';
import { t } from 'i18next';
import { useEffect } from 'react';
import { toast } from 'sonner';

import {
  dropHeldEmits,
  emitInProject,
  useSocket,
} from '@/components/providers/socket-provider';
import { editorSession } from '@/lib/editor-session';
import { errorReporting } from '@/lib/error-reporting';

export function useTableRoom({
  tableId,
  onChange,
  onJoined,
}: {
  tableId: string | undefined;
  onChange: (change: TableChange) => void;
  onJoined: (join: { sentAt: number }) => void;
}) {
  const socket = useSocket();
  useEffect(() => {
    if (isNil(tableId)) {
      return;
    }
    let active = true;
    const joinKey = Symbol('table-room-join');
    const join = () =>
      emitInProject({
        key: joinKey,
        send: () => {
          if (!active) {
            return;
          }
          const sentAt = Date.now();
          socket
            .timeout(JOIN_TIMEOUT_MS)
            .emit(
              WebsocketServerEvent.JOIN_TABLE_ROOM,
              { tableId },
              (error: Error | null, response: unknown) => {
                if (!active) {
                  return;
                }
                if (!isNil(error)) {
                  errorReporting.report({
                    error,
                    source: 'table-live-updates',
                  });
                  showLiveUpdatesDelayed();
                  return;
                }
                const parsed = JoinTableRoomResponse.safeParse(response);
                if (parsed.success && parsed.data.joined) {
                  toast.dismiss(TABLE_LIVE_UPDATES_TOAST_ID);
                  onJoined({ sentAt });
                  return;
                }
                showLiveUpdatesDelayed();
              },
            );
        },
      });
    const onRecordsChanged = (payload: unknown) => {
      const parsed = TableRecordsChangedEvent.safeParse(payload);
      if (!parsed.success) {
        return;
      }
      const event = parsed.data;
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
      active = false;
      dropHeldEmits([joinKey]);
      socket.off(WebsocketClientEvent.TABLE_RECORDS_CHANGED, onRecordsChanged);
      socket.off('connect', join);
      if (socket.connected) {
        socket.emit(WebsocketServerEvent.LEAVE_TABLE_ROOM, { tableId });
      }
    };
  }, [socket, tableId, onChange, onJoined]);
}

function showLiveUpdatesDelayed() {
  toast(t('Live updates are delayed'), {
    id: TABLE_LIVE_UPDATES_TOAST_ID,
    description: t('Changes made by others may show up late.'),
  });
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
    case TableRecordsChangeOp.TABLE_UPDATED:
      return { type: 'reload', scope: 'table' };
    case TableRecordsChangeOp.TABLE_DELETED:
      return { type: 'deleted' };
  }
}

const JOIN_TIMEOUT_MS = 10_000;

const TABLE_LIVE_UPDATES_TOAST_ID = 'table-live-updates';

export type TableChange =
  | { type: 'rows'; records: PopulatedRecord[]; removedIds: string[] }
  | { type: 'cleared' }
  | { type: 'deleted' }
  | { type: 'reload'; scope: 'table' | 'records' | 'fields' };
