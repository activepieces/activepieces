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
  const setRowsExiting = useTableState((state) => state.setRowsExiting);
  const reconcileServerSnapshot = useTableState(
    (state) => state.reconcileServerSnapshot,
  );

  const isAiActiveRef = useRef(isAiActive);
  const readyRef = useRef(true);
  const bufferRef = useRef<TableServerDelta[]>([]);
  // One keyed timer per exiting row — so the delete animation is deterministic and a
  // superseding event / unmount can cancel it cleanly (no anonymous setTimeout soup).
  const exitTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

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
        // Drain at a FIXED cadence so a burst always cascades identically. Past a cap we
        // apply the remainder in one frame rather than dragging a huge insert out forever.
        const overCap = streamQueueRef.current.length > STAGGER_MAX_QUEUE;
        const next = streamQueueRef.current.shift();
        if (next === undefined) {
          streamTimerRef.current = null;
          return;
        }
        applyServerDelta(next);
        streamTimerRef.current = setTimeout(drain, overCap ? 0 : STAGGER_MS);
      };
      streamQueueRef.current.push(delta);
      if (streamTimerRef.current === null) {
        drain();
      }
    },
    [applyServerDelta],
  );

  useEffect(() => {
    const exitTimers = exitTimersRef.current;
    return () => {
      if (streamTimerRef.current !== null) {
        clearTimeout(streamTimerRef.current);
        streamTimerRef.current = null;
      }
      exitTimers.forEach((timer) => clearTimeout(timer));
      exitTimers.clear();
    };
  }, []);

  useEffect(() => {
    const handle = (delta: TableServerDelta) => {
      if (!isAiActiveRef.current) {
        return;
      }
      if (!readyRef.current) {
        bufferRef.current.push(delta);
        return;
      }
      // Delete is a deterministic two-beat: mark the row exiting (takeover border +
      // disintegrate + track-collapse), then commit the removal after a FIXED beat via a
      // keyed timer (replaces any in-flight one for the same row so repeats can't stack).
      if (delta.kind === 'record-deleted') {
        const { recordId } = delta;
        const existing = exitTimersRef.current.get(recordId);
        if (existing) {
          clearTimeout(existing);
        }
        setRowsExiting([recordId]);
        const timer = setTimeout(() => {
          exitTimersRef.current.delete(recordId);
          enqueueApply(delta);
        }, EXIT_MS);
        exitTimersRef.current.set(recordId, timer);
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
  }, [socket, tableId, enqueueApply, setRowsExiting]);

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
      // On turn end we DON'T abruptly clear: the snapshot above is authoritative, and any
      // in-flight exit timer still fires (its delete is idempotent against the snapshot), so
      // a row caught mid-disintegration finishes cleanly instead of snapping away.
    })();
    return () => {
      cancelled = true;
    };
  }, [isAiActive, tableId, enqueueApply, reconcileServerSnapshot]);
}

export { useTableRealtime };

// The delete beat: mark the row exiting (the overlay clones it into a disintegrating
// ghost synchronously at that moment), then remove the real row one frame later. The
// ghost — not the real row — carries the full dissolve, so this only needs to outlast
// the clone, not the animation.
const EXIT_MS = 32;
// Fixed cascade cadence for create/update bursts — identical every time. Past the cap a large
// burst applies its remainder in one frame instead of dragging on.
const STAGGER_MS = 45;
const STAGGER_MAX_QUEUE = 24;

type UseTableRealtimeParams = {
  tableId: string;
  isAiActive: boolean;
};
