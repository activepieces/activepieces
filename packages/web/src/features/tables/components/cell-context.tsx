import { FieldType } from '@activepieces/shared';
import { createContext, useContext } from 'react';

import { useTableState } from './ap-table-state-provider';

type Cell = {
  rowIdx: number;
  columnIdx: number;
  fieldType: FieldType;
  value: string;
};

type CellContextType = {
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  handleCellChange: (newCellValue: string) => void;
  disabled: boolean;
} & Cell;

const CellContext = createContext<CellContextType>({
  isEditing: false,
  setIsEditing: () => {},
  value: '',
  handleCellChange: () => {},
  rowIdx: 0,
  columnIdx: 0,
  fieldType: FieldType.TEXT,
  disabled: false,
});

type CellProviderProps = CellContextType & {
  children: React.ReactNode;
  containerRef: React.RefObject<HTMLDivElement | null>;
};

export const CellProvider = ({
  rowIdx,
  columnIdx,
  fieldType,
  value,
  children,
  containerRef,
  isEditing,
  setIsEditing,
  disabled,
}: CellProviderProps) => {
  const updateRecord = useTableState((state) => state.updateRecord);
  const focustContainer = () => {
    // need to refocus container so keyboard navigation between cells works
    // if it was done immediately, the cell would be blurred and call handleRowChange
    requestAnimationFrame(() => {
      containerRef.current?.focus();
    });
  };

  const handleCellChange = (newCellValue: string) => {
    updateRecord(rowIdx, {
      values: [{ fieldIndex: columnIdx, value: newCellValue }],
    });
    setIsEditing(false);
    focustContainer();
  };
  return (
    <CellContext.Provider
      value={{
        rowIdx,
        columnIdx,
        fieldType,
        value,
        isEditing,
        setIsEditing: (value) => {
          setIsEditing(value);
          if (!value) {
            focustContainer();
          }
        },
        handleCellChange,
        disabled,
      }}
    >
      {children}
    </CellContext.Provider>
  );
};

export const useCellContext = () => {
  return useContext(CellContext);
};
