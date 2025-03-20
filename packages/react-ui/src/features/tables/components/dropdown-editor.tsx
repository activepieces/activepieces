import { useRef, useState } from 'react';
import type { RenderEditCellProps } from 'react-data-grid';

import { SearchableSelect } from '@/components/custom/searchable-select';
import { FieldType, StaticDropdownEmptyOption } from '@activepieces/shared';

import { ClientField } from '../lib/store/ap-tables-client-state';
import { Row } from '../lib/types';

const DropdownEditor = ({
  row,
  column,
  onRowChange,
  value: initialValue,
  field,
  onClose,
}: RenderEditCellProps<Row, { id: string }> & {
  value: string;
  field: ClientField;
}) => {
  const [value, setValue] = useState(initialValue);

  const containerRef = useRef<HTMLDivElement>(null);
  if (field.type !== FieldType.STATIC_DROPDOWN) {
    console.error('DropdownEditor can only be used for STATIC_DROPDOWN fields');
    return null;
  }
  const handleChange = (newValue: string | null) => {
    setValue(newValue ?? '');
    onRowChange({ ...row, [column.key]: newValue }, true);
    onClose();
  };

  return (
    <div className="h-full relative w-full" ref={containerRef}>
      <SearchableSelect
        triggerClassName="rounded-none border-primary  border-2 px-2"
        onClose={onClose}
        options={[
          StaticDropdownEmptyOption,
          ...field.data.options.map((option) => ({
            value: option.value,
            label: option.value,
          })),
        ]}
        onChange={handleChange}
        value={value}
        disabled={false}
        placeholder={''}
        showDeselect={false}
      ></SearchableSelect>
    </div>
  );
};
DropdownEditor.displayName = 'DropdownEditor';
export { DropdownEditor };
