import { useEffect, useRef, useState } from 'react';
import { CalculatedColumn } from 'react-data-grid';
import { ErrorBoundary } from 'react-error-boundary';

import { cn } from '@/lib/utils';
import { FieldType } from '@activepieces/shared';

import { ClientField } from '../lib/store/ap-tables-client-state';
import { Row } from '../lib/types';

import { useTableState } from './ap-table-state-provider';
import { CellProvider } from './cell-context';
import { DateEditor } from './date-editor';
import { DropdownEditor } from './dropdown-editor';
import { NumberEditor } from './number-editor';
import { TextEditor } from './text-editor';

type EditableCellProps = {
  field: ClientField;
  value?: string;
  row: Row;
  onClick?: () => void;
  column: CalculatedColumn<Row, { id: string }>;
  rowIdx: number;
  disabled?: boolean;
  locked?: boolean;
};

const EditorSelector = ({ fieldType }: { fieldType: FieldType }) => {
  switch (fieldType) {
    case FieldType.DATE:
      return <DateEditor />;
    case FieldType.NUMBER:
      return <NumberEditor />;
    case FieldType.STATIC_DROPDOWN:
      return <DropdownEditor></DropdownEditor>;
    default:
      return <TextEditor />;
  }
};

const useSetInitialFocus = (isSelected: boolean) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    requestAnimationFrame(() => {
      if (isSelected) {
        containerRef.current?.focus();
      }
    });
  }, []);
  return containerRef;
};

export function EditableCell({
  field,
  column,
  rowIdx,
  onClick,
  locked = false,
  value,
  disabled = false,
}: EditableCellProps) {
  const [selectedCell, setSelectedCell, records, fields] = useTableState(
    (state) => [
      state.selectedCell,
      state.setSelectedCell,
      state.records,
      state.fields,
    ],
  );
  const [isEditing, setIsEditing] = useState(false);
  const isSelected =
    selectedCell?.rowIdx === rowIdx && selectedCell?.columnIdx === column.idx;
  const containerRef = useSetInitialFocus(isSelected);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const isTypingKey = e.key.length === 1 || e.key === 'Enter';
    if (isTypingKey && !disabled && !isEditing) {
      setIsEditing(true);
      setSelectedCell({ rowIdx, columnIdx: column.idx });
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
      }
      return;
    }
    // react data grid cells are all focusable and they have no api to prevent focus
    // so we need to prevent the default behavior of the arrow keys
    switch (e.key) {
      case 'ArrowUp': {
        if (rowIdx === 0) {
          e.preventDefault();
          e.stopPropagation();
        }
        break;
      }
      case 'ArrowDown': {
        if (rowIdx === records.length - 1) {
          e.preventDefault();
          e.stopPropagation();
        }
        break;
      }
      case 'ArrowLeft':
        if (column.idx === 1) {
          e.preventDefault();
          e.stopPropagation();
        }
        break;
      case 'ArrowRight': {
        if (column.idx === fields.length) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    }
  };
  const isDropdown = field.type === FieldType.STATIC_DROPDOWN;
  return (
    <div
      ref={containerRef}
      id={`editable-cell-${rowIdx}-${column.idx}`}
      className={
        isEditing
          ? 'h-full w-full'
          : cn(
              'h-full flex items-center justify-between gap-2  focus:outline-none  ',
              'group cursor-pointer border',
              isSelected && !locked ? 'border-primary' : 'border-transparent',
              locked && 'locked-row',
              !isDropdown && 'pl-2 py-2',
            )
      }
      tabIndex={0}
      onClick={() => {
        onClick?.();
        setSelectedCell({ rowIdx, columnIdx: column.idx });
      }}
      onFocus={() => {
        setSelectedCell({ rowIdx, columnIdx: column.idx });
      }}
      onDoubleClick={() => {
        if (!disabled) {
          setIsEditing(true);
        }
      }}
      onKeyDown={handleKeyDown}
    >
      <ErrorBoundary fallback={<div>Error</div>}>
        <CellProvider
          rowIdx={rowIdx}
          columnIdx={column.idx - 1}
          fieldType={field.type}
          value={value ?? ''}
          handleCellChange={() => {}}
          containerRef={containerRef}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          disabled={disabled}
        >
          <EditorSelector fieldType={field.type} />
        </CellProvider>
      </ErrorBoundary>
    </div>
  );
}
