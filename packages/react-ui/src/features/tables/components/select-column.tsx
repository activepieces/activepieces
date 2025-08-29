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
        variant="secondary"
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
  const locked = row.locked;
  const { isRowSelected, onRowSelectionChange } = useRowSelection();
  const previousStatus = useRef<Row['status'] | undefined>();
  return (
    <div
      className={cn(
        'flex items-center justify-start h-full pl-4 group',
        locked && 'locked-row',
      )}
      onClick={onClick}
    >
      {!locked && (
        <div
          className={cn('group-hover:block hidden', isRowSelected && '!block')}
        >
          <Checkbox
            aria-label="Select row"
            variant="secondary"
            checked={Boolean(isRowSelected)}
            onCheckedChange={(checked) => {
              onRowSelectionChange({
                row,
                checked: Boolean(checked),
                isShiftClick: false,
              });
            }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          />
        </div>
      )}
      <div
        className={cn(
          locked ? 'block select-none' : 'group-hover:hidden block select-none',
          isRowSelected && !locked && '!hidden',
        )}
      >
        {locked ? (
          <img
            src="https://cdn.activepieces.com/quicknew/agents/robots/robot_186.png"
            alt="Locked"
            className="w-6 h-6 rounded-full object-cover"
            style={{ display: 'inline-block' }}
          />
        ) : (
          rowIndex
        )}
      </div>
    </div>
  );
}
