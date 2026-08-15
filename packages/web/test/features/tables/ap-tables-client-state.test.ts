import { Table, TableAutomationStatus } from '@activepieces/shared';
import { describe, expect, it, vi } from 'vitest';

import { createApTableStore } from '@/features/tables/stores/store/ap-tables-client-state';

vi.mock('@/features/tables/stores/store/ap-tables-server-state', () => ({
  createServerState: () => ({}),
}));

const table: Table = {
  id: 'table-1',
  created: '2026-08-12T00:00:00.000Z',
  updated: '2026-08-12T00:00:00.000Z',
  name: 'New Table',
  projectId: 'project-1',
  externalId: 'table-1',
  status: TableAutomationStatus.ENABLED,
  trigger: null,
};

describe('createApTableStore', () => {
  it('does not notify subscribers when the same cell is selected again', () => {
    const store = createApTableStore(table, [], []);
    store.getState().setSelectedCell({ rowIdx: 0, columnIdx: 2 });

    const listener = vi.fn();
    store.subscribe(listener);

    store.getState().setSelectedCell({ rowIdx: 0, columnIdx: 2 });
    expect(listener).not.toHaveBeenCalled();

    store.getState().setSelectedCell({ rowIdx: 1, columnIdx: 2 });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getState().selectedCell).toEqual({ rowIdx: 1, columnIdx: 2 });
  });
});
