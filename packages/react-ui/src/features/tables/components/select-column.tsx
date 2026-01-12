import { useHeaderRowSelection, useRowSelection } from 'react-data-grid';

import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

import { Row } from '../lib/types';

export function SelectHeaderCell() {
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

export function SelectCell({
  row,
  rowIndex,
  onClick,
}: {
  row: Row;
  rowIndex: number;
  onClick?: () => void;
}) {
  const { isRowSelected, onRowSelectionChange } = useRowSelection();
  return (
    <div
      className={cn('flex items-center justify-start h-full pl-4 group')}
      onClick={onClick}
    >
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
