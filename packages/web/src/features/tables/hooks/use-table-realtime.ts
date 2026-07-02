import {
  Field,
  SeekPage,
  PopulatedRecord,
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
import { useAiLockDeltaStream } from '@/hooks/use-ai-lock-delta-stream';

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
 * On turn end we DON'T abruptly clear anything client-local: the falling-edge
 * snapshot is authoritative, and any in-flight exit timer (see below) still
 * fires — its delete is idempotent against the snapshot — so a row caught
 * mid-disintegration finishes cleanly instead of snapping away.
 *
 * The queue/timer/ready/buffer plumbing (staggered apply, lock-edge reconcile)
 * is shared with `use-flow-realtime` via `useAiLockDeltaStream`.
 */
function useTableRealtime({ tableId, isAiActive }: UseTableRealtimeParams) {
  const socket = useSocket();
  const applyServerDelta = useTableState((state) => state.applyServerDelta);
  const setRowsExiting = useTableState((state) => state.setRowsExiting);
  const reconcileServerSnapshot = useTableState(
    (state) => state.reconcileServerSnapshot,
  );

  // One keyed timer per exiting row — so the delete animation is deterministic and a
  // superseding event / unmount can cancel it cleanly (no anonymous setTimeout soup).
  const exitTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const fetchSnapshot = useCallback(
    () =>
      Promise.all([
        recordsApi.list({ tableId, limit: 99999999, cursor: undefined }),
        fieldsApi.list({ tableId }),
      ]),
    [tableId],
  );

  const reconcile = useCallback(
    ([records, fields]: [SeekPage<PopulatedRecord>, Field[]]) => {
      reconcileServerSnapshot({ fields, records: records.data });
    },
    [reconcileServerSnapshot],
  );

  const { enqueueApply, bufferDelta, isAiActiveRef, readyRef } =
    useAiLockDeltaStream<
      TableServerDelta,
      [SeekPage<PopulatedRecord>, Field[]]
    >({
      isAiActive,
      staggerMs: STAGGER_MS,
      staggerMaxQueue: STAGGER_MAX_QUEUE,
      fetchSnapshot,
      reconcile,
      applyDelta: applyServerDelta,
    });

  useEffect(() => {
    const exitTimers = exitTimersRef.current;
    return () => {
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
        bufferDelta(delta);
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
  }, [
    socket,
    tableId,
    enqueueApply,
    setRowsExiting,
    bufferDelta,
    isAiActiveRef,
    readyRef,
  ]);
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
