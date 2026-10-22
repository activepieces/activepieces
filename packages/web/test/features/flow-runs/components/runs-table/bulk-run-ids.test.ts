import { describe, expect, it } from 'vitest';

import { resolveBulkFlowRunIds } from '@/features/flow-runs/components/runs-table/bulk-run-ids';

describe('resolveBulkFlowRunIds', () => {
  it('sends the ticked rows when select all is off', () => {
    expect(
      resolveBulkFlowRunIds({
        selectedAll: false,
        selectedRows: [{ id: 'run-1' }, { id: 'run-2' }],
        filteredRunIds: ['run-3', 'run-4'],
      }),
    ).toEqual(['run-1', 'run-2']);
  });

  it('keeps select all scoped to the flowRunIds url filter', () => {
    expect(
      resolveBulkFlowRunIds({
        selectedAll: true,
        selectedRows: [{ id: 'run-1' }],
        filteredRunIds: ['run-1', 'run-2'],
      }),
    ).toEqual(['run-1', 'run-2']);
  });

  it('leaves select all unscoped when no flowRunIds filter is active', () => {
    expect(
      resolveBulkFlowRunIds({
        selectedAll: true,
        selectedRows: [{ id: 'run-1' }],
        filteredRunIds: [],
      }),
    ).toBeUndefined();
  });
});
