import { useRef } from 'react';

import { SearchableSelect } from '@/components/custom/searchable-select';
import { cn } from '@/lib/utils';
import { FieldType, StaticDropdownEmptyOption } from '@activepieces/shared';

import { useTableState } from './ap-table-state-provider';
import { useCellContext } from './cell-context';

const DropdownEditor = () => {
  const {
    value,
    handleCellChange,
    setIsEditing,
    isEditing,
    columnIdx,
    disabled,
  } = useCellContext();
  const field = useTableState((state) => state.fields[columnIdx]);
  const containerRef = useRef<HTMLDivElement>(null);
  const handleChange = (newValue: string | null) => {
    handleCellChange(newValue ?? '');
  };
  if (field?.type !== FieldType.STATIC_DROPDOWN) {
    console.log(field);
    console.error('DropdownEditor can only be used for STATIC_DROPDOWN fields');
    return null;
  }
  return (
    <div
      className={cn('h-full w-full', {
        'border-primary  border-2': isEditing,
      })}
      ref={containerRef}
    >
      <SearchableSelect
        triggerClassName={cn('rounded-none px-2 border-none bg-transparent')}
        onClose={() => {
          setIsEditing(false);
        }}
        options={[
          StaticDropdownEmptyOption,
          ...field.data.options.map((option) => ({
            value: option.value,
            label: option.value,
          })),
        ]}
        onChange={handleChange}
        value={value}
        disabled={disabled}
        placeholder={''}
        showDeselect={false}
        openState={{
          open: isEditing,
          setOpen: setIsEditing,
        }}
      ></SearchableSelect>
    </div>
  );
};
DropdownEditor.displayName = 'DropdownEditor';
export { DropdownEditor };
