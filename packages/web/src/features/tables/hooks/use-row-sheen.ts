import { useCallback, useState } from 'react';

import { useFollowAlong } from '@/features/chat/lib/follow/follow-along';

export function useRowSheen(records: { uuid: string }[]) {
  const flashes = useFollowAlong((state) => state.flashes);
  const live = useFollowAlong((state) => state.phase === 'editing');
  const [shown, setShown] = useState<ReadonlyMap<string, number>>(new Map());
  const played = useCallback(
    ({ rowId, token }: RowSheen) =>
      setShown((previous) => {
        const current = useFollowAlong.getState().flashes;
        const stillLit = [...previous].filter(
          ([id, shownToken]) => current[rowKey(id)] === shownToken,
        );
        return new Map(stillLit).set(rowId, token);
      }),
    [],
  );
  const pendingToken = useCallback(
    (rowId: string): number | null => {
      const token = flashes[rowKey(rowId)];
      if (!live || token === undefined || shown.get(rowId) === token) {
        return null;
      }
      return token;
    },
    [flashes, live, shown],
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

function rowKey(rowId: string): string {
  return `table-row:${rowId}`;
}

export type RowSheen = { rowId: string; token: number };
