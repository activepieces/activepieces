import { tryCatch } from '@activepieces/core-utils';
import {
  TableFieldCreatedEvent,
  TableFieldDeletedEvent,
  TableFieldUpdatedEvent,
  TableRecordCreatedEvent,
  TableRecordDeletedEvent,
  TableRecordUpdatedEvent,
  WebsocketClientEvent,
} from '@activepieces/shared';
import { useCallback, useEffect, useRef } from 'react';

import { useSocket } from '@/components/providers/socket-provider';

import { fieldsApi } from '../api/fields-api';
import { recordsApi } from '../api/records-api';
import { useTableState } from '../components/ap-table-state-provider';
import { TableServerDelta } from '../stores/store/ap-tables-client-state';

/**
 * Live "resource delta" channel for an open table. While the table is under an
 * AI lock, every record/field mutation the agent makes is broadcast to the
 * project room and applied to the store incrementally (idempotent by id), so the
 * grid fills in live instead of waiting for the agent to finish.
 *
 * Reconciliation: on BOTH edges of the AI lock we re-fetch a fresh snapshot and
 * reconcile it. On the rising edge (lock first observed, e.g. the table is opened
 * mid-run) we buffer deltas that arrive during the fetch and drain them after,
 * closing the window between the initial snapshot and the socket subscription. On
 * the falling edge (the agent finished) we take one authoritative snapshot so the
 * grid reflects the final server state even if some deltas were never seen by this
 * client — without this, "the agent edited the table" leaves the open grid stale,
 * since the grid store is built once at mount and react-query invalidation never
 * reaches it.
 *
 * The same shape can be reused for flows later: subscribe → gate on AI lock →
 * idempotent apply → catch-up reconcile.
 */
function useTableRealtime({ tableId, isAiActive }: UseTableRealtimeParams) {
  const socket = useSocket();
  const applyServerDelta = useTableState((state) => state.applyServerDelta);
  const reconcileServerSnapshot = useTableState(
    (state) => state.reconcileServerSnapshot,
  );

  const isAiActiveRef = useRef(isAiActive);
  const readyRef = useRef(true);
  const bufferRef = useRef<TableServerDelta[]>([]);

  // A burst of deltas from one agent write (e.g. ap_insert_records inserting many
  // rows) is emitted back-to-back and would otherwise land in a single frame — all
  // rows popping in at once. Drain them through a small stagger so they cascade in
  // one after another: the first applies immediately (responsive), the rest follow
  // ~STREAM_STAGGER_MS apart, capped so a large insert never feels sluggish.
  const streamQueueRef = useRef<TableServerDelta[]>([]);
  const streamTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enqueueApply = useCallback(
    (delta: TableServerDelta) => {
      const drain = () => {
        const next = streamQueueRef.current.shift();
        if (next === undefined) {
          streamTimerRef.current = null;
          return;
        }
        applyServerDelta(next);
        const stagger = Math.max(
          MIN_STREAM_STAGGER_MS,
          Math.min(
            STREAM_STAGGER_MS,
            Math.round(
              STREAM_STAGGER_BUDGET_MS / (streamQueueRef.current.length || 1),
            ),
          ),
        );
        streamTimerRef.current = setTimeout(drain, stagger);
      };
      streamQueueRef.current.push(delta);
      if (streamTimerRef.current === null) {
        drain();
      }
    },
    [applyServerDelta],
  );

  useEffect(
    () => () => {
      if (streamTimerRef.current !== null) {
        clearTimeout(streamTimerRef.current);
        streamTimerRef.current = null;
      }
    },
    [],
  );

  useEffect(() => {
    const handle = (delta: TableServerDelta) => {
      if (!isAiActiveRef.current) {
        return;
      }
      if (!readyRef.current) {
        bufferRef.current.push(delta);
        return;
      }
      enqueueApply(delta);
    };

    const onRecordCreated = (event: TableRecordCreatedEvent) => {
      if (event.tableId !== tableId) return;
      handle({ kind: 'record-created', record: event.record });
    };
    const onRecordUpdated = (event: TableRecordUpdatedEvent) => {
      if (event.tableId !== tableId) return;
      handle({ kind: 'record-updated', record: event.record });
    };
    const onRecordDeleted = (event: TableRecordDeletedEvent) => {
      if (event.tableId !== tableId) return;
      handle({ kind: 'record-deleted', recordId: event.recordId });
    };
    const onFieldCreated = (event: TableFieldCreatedEvent) => {
      if (event.tableId !== tableId) return;
      handle({ kind: 'field-created', field: event.field });
    };
    const onFieldUpdated = (event: TableFieldUpdatedEvent) => {
      if (event.tableId !== tableId) return;
      handle({ kind: 'field-updated', field: event.field });
    };
    const onFieldDeleted = (event: TableFieldDeletedEvent) => {
      if (event.tableId !== tableId) return;
      handle({ kind: 'field-deleted', fieldId: event.fieldId });
    };

    socket.on(WebsocketClientEvent.TABLE_RECORD_CREATED, onRecordCreated);
    socket.on(WebsocketClientEvent.TABLE_RECORD_UPDATED, onRecordUpdated);
    socket.on(WebsocketClientEvent.TABLE_RECORD_DELETED, onRecordDeleted);
    socket.on(WebsocketClientEvent.TABLE_FIELD_CREATED, onFieldCreated);
    socket.on(WebsocketClientEvent.TABLE_FIELD_UPDATED, onFieldUpdated);
    socket.on(WebsocketClientEvent.TABLE_FIELD_DELETED, onFieldDeleted);

    return () => {
      socket.off(WebsocketClientEvent.TABLE_RECORD_CREATED, onRecordCreated);
      socket.off(WebsocketClientEvent.TABLE_RECORD_UPDATED, onRecordUpdated);
      socket.off(WebsocketClientEvent.TABLE_RECORD_DELETED, onRecordDeleted);
      socket.off(WebsocketClientEvent.TABLE_FIELD_CREATED, onFieldCreated);
      socket.off(WebsocketClientEvent.TABLE_FIELD_UPDATED, onFieldUpdated);
      socket.off(WebsocketClientEvent.TABLE_FIELD_DELETED, onFieldDeleted);
    };
  }, [socket, tableId, enqueueApply]);

  useEffect(() => {
    const wasActive = isAiActiveRef.current;
    isAiActiveRef.current = isAiActive;
    if (isAiActive === wasActive) {
      return;
    }
    let cancelled = false;
    if (isAiActive) {
      readyRef.current = false;
      bufferRef.current = [];
    }
    void (async () => {
      const { data } = await tryCatch(() =>
        Promise.all([
          recordsApi.list({ tableId, limit: 99999999, cursor: undefined }),
          fieldsApi.list({ tableId }),
        ]),
      );
      if (!cancelled && data) {
        const [records, fields] = data;
        reconcileServerSnapshot({ fields, records: records.data });
      }
      if (isAiActive) {
        readyRef.current = true;
        const buffered = bufferRef.current;
        bufferRef.current = [];
        buffered.forEach(enqueueApply);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAiActive, tableId, enqueueApply, reconcileServerSnapshot]);
}

export { useTableRealtime };

const STREAM_STAGGER_MS = 70;
const MIN_STREAM_STAGGER_MS = 18;
const STREAM_STAGGER_BUDGET_MS = 1400;

type UseTableRealtimeParams = {
  tableId: string;
  isAiActive: boolean;
};
