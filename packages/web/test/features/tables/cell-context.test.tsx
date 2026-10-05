/** @vitest-environment jsdom */
import { FieldType } from '@activepieces/shared';
import { render } from '@testing-library/react';
import { useEffect } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  CellProvider,
  useCellContext,
} from '@/features/tables/components/cell-context';

const updateRecord = vi.hoisted(() => vi.fn());

vi.mock('@/features/tables/components/ap-table-state-provider', () => ({
  useTableState: <T,>(selector: (state: { updateRecord: unknown }) => T) =>
    selector({ updateRecord }),
}));

function CommitEdit({ value }: { value: string }) {
  const { handleCellChange } = useCellContext();
  useEffect(() => handleCellChange(value), [handleCellChange, value]);
  return null;
}

describe('CellProvider', () => {
  it('saves only the edited cell', () => {
    render(
      <CellProvider
        rowIdx={3}
        columnIdx={1}
        fieldType={FieldType.TEXT}
        value="old"
        isEditing={true}
        setIsEditing={() => undefined}
        handleCellChange={() => undefined}
        disabled={false}
        containerRef={{ current: null }}
      >
        <CommitEdit value="new" />
      </CellProvider>,
    );

    expect(updateRecord).toHaveBeenCalledWith(3, {
      values: [{ fieldIndex: 1, value: 'new' }],
    });
  });
});
