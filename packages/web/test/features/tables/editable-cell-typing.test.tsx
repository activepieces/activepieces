/** @vitest-environment jsdom */
import { FieldType } from '@activepieces/shared';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { CalculatedColumn } from 'react-data-grid';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { EditableCell } from '@/features/tables/components/editable-cell';
import { Row } from '@/features/tables/types/types';

const tableState = vi.hoisted(() => ({
  selectedCell: null,
  setSelectedCell: vi.fn(),
  records: [],
  fields: [],
  updateRecord: vi.fn(),
}));

vi.mock('@/features/tables/components/ap-table-state-provider', () => ({
  useTableState: <T,>(selector: (state: typeof tableState) => T) =>
    selector(tableState),
}));
vi.mock('@/features/tables/components/text-editor', () => ({
  TextEditor: () => null,
}));

describe('EditableCell typing', () => {
  afterEach(() => {
    cleanup();
  });

  it('starts editing for a character typed with AltGr', () => {
    renderCell();

    fireEvent.keyDown(cell(), { key: '@', ctrlKey: true, altKey: true });

    expect(cell().getAttribute('data-editing')).toBe('true');
  });

  it('starts editing for a character typed with Option', () => {
    renderCell();

    fireEvent.keyDown(cell(), { key: 'å', altKey: true });

    expect(cell().getAttribute('data-editing')).toBe('true');
  });

  it('does not start editing for a Ctrl or Cmd shortcut', () => {
    renderCell();

    fireEvent.keyDown(cell(), { key: 'c', ctrlKey: true });
    fireEvent.keyDown(cell(), { key: 'v', metaKey: true });

    expect(cell().getAttribute('data-editing')).toBe('false');
  });
});

function renderCell() {
  render(
    <EditableCell
      field={{ uuid: 'f1', name: 'Name', type: FieldType.TEXT }}
      value="Ada"
      row={{ id: 'r1', agentRunId: null, locked: false }}
      column={column}
      rowIdx={0}
    />,
  );
}

function cell(): HTMLElement {
  const element = document.getElementById('editable-cell-0-1');
  if (element === null) throw new Error('cell not rendered');
  return element;
}

const column: CalculatedColumn<Row, { id: string }> = {
  name: 'Name',
  key: 'f1',
  parent: undefined,
  idx: 1,
  level: 0,
  width: 100,
  minWidth: 50,
  maxWidth: undefined,
  resizable: false,
  sortable: false,
  draggable: false,
  frozen: false,
  renderCell: () => null,
};
