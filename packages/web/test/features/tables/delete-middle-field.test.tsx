/** @vitest-environment jsdom */
import {
  Field,
  FieldType,
  PopulatedRecord,
  Table,
  TableAutomationStatus,
} from '@activepieces/shared';
import { render } from '@testing-library/react';
import { useEffect } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  CellProvider,
  useCellContext,
} from '@/features/tables/components/cell-context';
import { mapRecordsToRows } from '@/features/tables/components/table-columns';
import {
  createApTableStore,
  type ApTableStore,
} from '@/features/tables/stores/store/ap-tables-client-state';

const harness = vi.hoisted(() => ({
  store: undefined as undefined | ApTableStore,
}));

vi.mock('@/features/tables/stores/store/ap-tables-server-state', () => ({
  createServerState: (
    _table: unknown,
    fields: unknown[],
    records: unknown[],
  ) => ({
    deleteField: vi.fn(),
    createField: vi.fn(),
    fields,
    records,
  }),
}));

vi.mock('@/features/tables/components/ap-table-state-provider', () => ({
  useTableState: <T,>(selector: (state: unknown) => T) =>
    selector(harness.store!.getState()),
}));

const table: Table = {
  id: 'table-1',
  created: '2026-09-16T00:00:00.000Z',
  updated: '2026-09-16T00:00:00.000Z',
  name: 'Table',
  projectId: 'project-1',
  externalId: 'table-1',
  status: TableAutomationStatus.ENABLED,
  trigger: null,
};

const buildField = (id: string, name: string, position: number): Field => ({
  id,
  created: '2026-09-16T00:00:00.000Z',
  updated: '2026-09-16T00:00:00.000Z',
  name,
  externalId: id,
  type: FieldType.TEXT,
  tableId: table.id,
  projectId: table.projectId,
  position,
});

const buildCell = (value: string, fieldName: string) => ({
  created: '2026-09-16T00:00:00.000Z',
  updated: '2026-09-16T00:00:00.000Z',
  value,
  fieldName,
});

const fields = [
  buildField('field-a', 'A', 0),
  buildField('field-b', 'B', 1),
  buildField('field-c', 'C', 2),
];

const records: PopulatedRecord[] = [
  {
    id: 'record-1',
    created: '2026-09-16T00:00:00.000Z',
    updated: '2026-09-16T00:00:00.000Z',
    tableId: table.id,
    projectId: table.projectId,
    cells: {
      'field-a': buildCell('a-value', 'A'),
      'field-b': buildCell('b-value', 'B'),
      'field-c': buildCell('c-value', 'C'),
    },
  },
];

const createStore = () => createApTableStore(table, fields, records);

describe('deleteField remaps surviving cells (ENG-537)', () => {
  it('keeps the values of every column to the right of the deleted one', () => {
    const store = createStore();

    store.getState().deleteField(1);

    const state = store.getState();
    expect(state.fields.map((field) => field.name)).toEqual(['A', 'C']);
    expect(state.records[0].values).toEqual([
      { fieldIndex: 0, value: 'a-value' },
      { fieldIndex: 1, value: 'c-value' },
    ]);
  });

  it('still renders the shifted column in the grid', () => {
    const store = createStore();

    store.getState().deleteField(1);

    const state = store.getState();
    const [row] = mapRecordsToRows(state.records, state.fields);
    expect(row['field-a']).toBe('a-value');
    expect(row['field-c']).toBe('c-value');
  });

  it('does not off-by-one when the last column is deleted', () => {
    const store = createStore();

    store.getState().deleteField(2);

    const state = store.getState();
    expect(state.fields.map((field) => field.name)).toEqual(['A', 'B']);
    expect(state.records[0].values).toEqual([
      { fieldIndex: 0, value: 'a-value' },
      { fieldIndex: 1, value: 'b-value' },
    ]);
  });

  it('leaves no index collision when a column is added after a middle delete', () => {
    const store = createStore();

    store.getState().deleteField(1);
    store
      .getState()
      .createField({ uuid: 'field-d', name: 'D', type: FieldType.TEXT });

    const indexes = store
      .getState()
      .records[0].values.map((cell) => cell.fieldIndex);
    expect(indexes).toEqual([0, 1, 2]);
  });

  it('does not overwrite the shifted column when a cell is edited afterwards', () => {
    const store = createStore();
    harness.store = store;
    store.getState().deleteField(1);

    const updateRecord = vi.fn();
    store.setState({ updateRecord });

    function Editor() {
      const { handleCellChange } = useCellContext();
      useEffect(() => {
        handleCellChange('a-edited');
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);
      return null;
    }

    render(
      <CellProvider
        rowIdx={0}
        columnIdx={0}
        fieldType={FieldType.TEXT}
        value="a-value"
        isEditing={true}
        setIsEditing={() => undefined}
        handleCellChange={() => undefined}
        disabled={false}
        containerRef={{ current: null }}
      >
        <Editor />
      </CellProvider>,
    );

    expect(updateRecord).toHaveBeenCalledWith(0, {
      values: [
        { fieldIndex: 0, value: 'a-edited' },
        { fieldIndex: 1, value: 'c-value' },
      ],
    });
  });
});
