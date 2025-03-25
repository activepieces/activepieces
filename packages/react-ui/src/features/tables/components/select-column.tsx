import {
  useHeaderRowSelection,
  useRowSelection,
  type Column,
} from 'react-data-grid';

import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

import { Row } from '../lib/types';

function SelectHeaderCell() {
  const { isRowSelected, onRowSelectionChange } = useHeaderRowSelection();

  return (
    <div
      className={cn(
        'flex items-center justify-start h-full pl-4',
        'bg-muted/50 hover:bg-muted',
        'data-[state=open]:bg-muted',
      )}
    >
      <Checkbox
        aria-label="Select all rows"
        checked={Boolean(isRowSelected)}
        onCheckedChange={(checked) => {
          onRowSelectionChange({ checked: Boolean(checked) });
        }}
      />
    </div>
  );
}

function SelectCell({ row, rowIndex }: { row: Row; rowIndex: number }) {
  const { isRowSelected, onRowSelectionChange } = useRowSelection();
  return (
    <div className="flex items-center justify-start h-full pl-4 group">
      <div
        className={cn('group-hover:block hidden', isRowSelected && '!block')}
      >
        <Checkbox
          aria-label="Select row"
          checked={Boolean(isRowSelected)}
          onCheckedChange={(checked) => {
            onRowSelectionChange({
              row,
              checked: Boolean(checked),
              isShiftClick: false,
            });
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <div
        className={cn(
          'group-hover:hidden block select-none',
          isRowSelected && '!hidden',
        )}
      >
        {rowIndex}
      </div>
    </div>
  );
}

export const SelectColumn: Column<Row, { id: string }> = {
  key: 'select-row',
  name: 'Select',
  width: 66,
  minWidth: 66,
  maxWidth: 66,
  resizable: false,
  sortable: false,
  frozen: true,
  renderHeaderCell: () => <SelectHeaderCell />,
  renderCell: (props) => (
    <SelectCell row={props.row} rowIndex={props.rowIdx + 1} />
  ),
};
