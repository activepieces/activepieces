// @vitest-environment jsdom
import { FieldType, Table, TableAutomationStatus } from '@activepieces/shared';
import { describe, expect, it, vi } from 'vitest';

import { createServerState } from '@/features/tables/stores/store/ap-tables-server-state';

const fieldsApiMock = vi.hoisted(() => ({ create: vi.fn() }));
const errorReportingMock = vi.hoisted(() => ({ report: vi.fn() }));

vi.mock('@/features/tables/api/fields-api', () => ({
  fieldsApi: fieldsApiMock,
}));

vi.mock('@/lib/error-reporting', () => ({
  errorReporting: errorReportingMock,
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

describe('createServerState', () => {
  it('reports a failed table save', async () => {
    const failure = new Error('field create failed');
    fieldsApiMock.create.mockRejectedValue(failure);
    const serverState = createServerState(table, [], [], () => undefined);

    serverState.createField({
      name: 'Email',
      type: FieldType.TEXT,
      tableId: table.id,
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(errorReportingMock.report).toHaveBeenCalledWith({
      error: failure,
      source: 'table-save',
    });
  });
});
