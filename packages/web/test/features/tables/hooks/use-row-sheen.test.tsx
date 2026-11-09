/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  followAlong,
  useFollowAlong,
} from '@/features/chat/lib/follow/follow-along';
import { useRowSheen } from '@/features/tables/hooks/use-row-sheen';

describe('useRowSheen', () => {
  beforeEach(() => {
    followAlong.reset();
    useFollowAlong.setState({ phase: 'editing', flashes: {} });
  });

  it('drops a row highlight that was not shown before the run ended', () => {
    useFollowAlong.setState({ flashes: { 'table-row:u1': 1 } });
    const { result } = renderSheen({ changedRows: [] });
    expect(result.current.pendingToken('u1')).toBe(1);

    act(() => useFollowAlong.setState({ phase: 'idle' }));

    expect(result.current.pendingToken('u1')).toBeNull();
    expect(result.current.firstRow).toBeNull();
  });

  it('plays each highlight once', () => {
    useFollowAlong.setState({ flashes: { 'table-row:u1': 1 } });
    const { result } = renderSheen({ changedRows: [] });

    act(() => result.current.played({ rowId: 'u1', token: 1 }));

    expect(result.current.pendingToken('u1')).toBeNull();
    act(() => useFollowAlong.setState({ flashes: { 'table-row:u1': 2 } }));
    expect(result.current.pendingToken('u1')).toBe(2);
  });
});

describe('useRowSheen on arrival', () => {
  beforeEach(() => {
    followAlong.reset();
  });

  it('sheens the rows the AI wrote before the table opened, once', () => {
    const beforeWrite = Date.now();
    aiWritesTable({ tableId: 't1' });
    const asked: number[] = [];
    const { result } = renderSheen({
      changedRows: ['u2'],
      onAsk: (since) => asked.push(since),
    });

    expect(asked).toHaveLength(1);
    expect(asked[0]).toBeLessThanOrEqual(beforeWrite);
    expect(result.current.pendingToken('u1')).toBeNull();
    expect(result.current.pendingToken('u2')).not.toBeNull();
    expect(result.current.firstRow?.index).toBe(1);

    const token = result.current.pendingToken('u2');
    act(() => result.current.played({ rowId: 'u2', token: token ?? 0 }));

    expect(result.current.pendingToken('u2')).toBeNull();
    expect(result.current.firstRow).toBeNull();
  });

  it('does not sheen again when the table is opened later', () => {
    aiWritesTable({ tableId: 't1' });
    const first = renderSheen({ changedRows: ['u2'] });
    expect(first.result.current.pendingToken('u2')).not.toBeNull();
    first.unmount();

    const second = renderSheen({ changedRows: ['u2'] });

    expect(second.result.current.pendingToken('u2')).toBeNull();
    expect(second.result.current.firstRow).toBeNull();
  });

  it('leaves other tables alone', () => {
    aiWritesTable({ tableId: 't2' });
    const { result } = renderSheen({ changedRows: ['u2'] });

    expect(result.current.pendingToken('u2')).toBeNull();
  });
});

function renderSheen({
  changedRows,
  onAsk,
}: {
  changedRows: string[];
  onAsk?: (since: number) => void;
}) {
  const records = [{ uuid: 'u1' }, { uuid: 'u2' }];
  return renderHook(() =>
    useRowSheen({
      records,
      tableId: 't1',
      rowIdsChangedSince: (since) => {
        onAsk?.(since);
        return changedRows;
      },
    }),
  );
}

function aiWritesTable({ tableId }: { tableId: string }): void {
  followAlong.onChunks({
    chunks: [
      {
        type: 'tool-input-available',
        toolCallId: `call-${tableId}`,
        toolName: 'ap_insert_records',
        input: { tableId },
      },
      {
        type: 'tool-output-available',
        toolCallId: `call-${tableId}`,
        output: {
          content: [{ type: 'text', text: 'done' }],
          _meta: {
            apResource: {
              v: 1,
              kind: 'table',
              id: tableId,
              projectId: 'p1',
              op: 'update',
              label: 'Leads',
            },
          },
        },
      },
    ],
    ctx: { conversationId: 'c1', runId: `run-${tableId}`, attach: 'resumed' },
  });
}
