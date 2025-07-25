import { createContext, useContext } from 'react';

import { FieldType } from '@activepieces/shared';

import { useTableState } from './ap-table-state-provider';

type Cell = {
  rowIdx: number;
  columnIdx: number;
  fieldType: FieldType;
  value: string;
};

const CellContext = createContext<
  {
    isEditing: boolean;
    setIsEditing: (isEditing: boolean) => void;
    handleCellChange: (newCellValue: string) => void;
  } & Cell
>({
  isEditing: false,
  setIsEditing: () => {},
  value: '',
  handleCellChange: () => {},
  rowIdx: 0,
  columnIdx: 0,
  fieldType: FieldType.TEXT,
});

export const CellProvider = ({
  cell,
  children,
  containerRef,
  isEditing,
  setIsEditing,
}: {
  cell: Cell;
  children: React.ReactNode;
  containerRef: React.RefObject<HTMLDivElement>;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
}) => {
  const [updateRecord, fields, records] = useTableState((state) => [
    state.updateRecord,
    state.fields,
    state.records,
  ]);
  const focustContainer = () => {
    // need to refocus container so keyboard navigation between cells works
    // if it was done immediately, the cell would be blurred and call handleRowChange
    requestAnimationFrame(() => {
      containerRef.current?.focus();
    });
  };

  const handleCellChange = (newCellValue: string) => {
    const record = records[cell.rowIdx];
    const newRecrodValues = fields.map((_, fIndex) => {
      // values order isn't guaranteed to be the same as fields order
      const fieldValue = record.values.find(
        (value) => value.fieldIndex === fIndex,
      )?.value;
      return {
        fieldIndex: fIndex,
        value: fieldValue ?? '',
      };
    });
    newRecrodValues[cell.columnIdx].value = newCellValue;
    updateRecord(cell.rowIdx, {
      values: newRecrodValues,
    });
    setIsEditing(false);
    focustContainer();
  };
  return (
    <CellContext.Provider
      value={{
        ...cell,
        isEditing,
        setIsEditing: (value) => {
          setIsEditing(value);
          if (!value) {
            focustContainer();
          }
        },
        handleCellChange,
      }}
    >
      {children}
    </CellContext.Provider>
  );
};

export const useCellContext = () => {
  return useContext(CellContext);
};
