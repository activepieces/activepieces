import { useCallback, useEffect, useState } from 'react';

import {
  followAlong,
  useFollowAlong,
} from '@/features/chat/lib/follow/follow-along';

export function useRowSheen({
  records,
  tableId,
  rowIdsChangedSince,
}: {
  records: { uuid: string }[];
  tableId: string;
  rowIdsChangedSince: (since: number) => string[];
}) {
  const flashes = useFollowAlong((state) => state.flashes);
  const live = useFollowAlong((state) => state.phase === 'editing');
  const [shown, setShown] = useState<ReadonlyMap<string, number>>(new Map());
  const [arrivals, setArrivals] = useState<ReadonlySet<string>>(() =>
    arrivalRowIds({ tableId, rowIdsChangedSince }),
  );
  useEffect(() => {
    followAlong.forgetEditedSince({ kind: 'table', id: tableId });
  }, [tableId]);
  const played = useCallback(({ rowId, token }: RowSheen) => {
    setArrivals((previous) => withoutRow({ rows: previous, rowId }));
    setShown((previous) => {
      const current = useFollowAlong.getState().flashes;
      const stillLit = [...previous].filter(
        ([id, shownToken]) => current[rowKey(id)] === shownToken,
      );
      return new Map(stillLit).set(rowId, token);
    });
  }, []);
  const pendingToken = useCallback(
    (rowId: string): number | null => {
      const token = flashes[rowKey(rowId)];
      if (live && token !== undefined && shown.get(rowId) !== token) {
        return token;
      }
      return arrivals.has(rowId) ? ARRIVAL_TOKEN : null;
    },
    [flashes, live, shown, arrivals],
  );
  const firstIndex = records.findIndex(
    (record) => pendingToken(record.uuid) !== null,
  );
  const firstToken =
    firstIndex === -1 ? null : pendingToken(records[firstIndex].uuid);
  return {
    firstRow:
      firstToken === null ? null : { index: firstIndex, token: firstToken },
    pendingToken,
    played,
  };
}

function arrivalRowIds({
  tableId,
  rowIdsChangedSince,
}: {
  tableId: string;
  rowIdsChangedSince: (since: number) => string[];
}): ReadonlySet<string> {
  const since = followAlong.peekEditedSince({ kind: 'table', id: tableId });
  if (since === null) return new Set();
  return new Set(rowIdsChangedSince(since - CLOCK_SKEW_MS));
}

function withoutRow({
  rows,
  rowId,
}: {
  rows: ReadonlySet<string>;
  rowId: string;
}): ReadonlySet<string> {
  if (!rows.has(rowId)) return rows;
  return new Set([...rows].filter((id) => id !== rowId));
}

function rowKey(rowId: string): string {
  return `table-row:${rowId}`;
}

const ARRIVAL_TOKEN = 0;
const CLOCK_SKEW_MS = 2000;

export type RowSheen = { rowId: string; token: number };
