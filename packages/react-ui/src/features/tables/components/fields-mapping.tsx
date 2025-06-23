import { t } from 'i18next';
import { ArrowLeftIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { SearchableSelect } from '@/components/custom/searchable-select';
import { Input } from '@/components/ui/input';
import { Field } from '@activepieces/shared';

import { FieldsMapping } from '../lib/utils';

const FieldsMappingControl = ({
  onChange,
  fields,
  csvColumns,
}: {
  onChange: (fieldsMapping: FieldsMapping) => void;
  fields: Field[];
  csvColumns: string[];
}) => {
  const initialFieldsMapping = Array(csvColumns.length)
    .fill(null)
    .map((_, index) => (index > fields.length - 1 ? null : fields[index].id));
  const [fieldsMapping, setFieldsMapping] =
    useState<FieldsMapping>(initialFieldsMapping);
  useEffect(() => {
    onChange(fieldsMapping);
  }, []);
  const csvColumnsOptions = [
    ...csvColumns.map((column, index) => ({
      label: column,
      value: index.toString(),
    })),
    { label: t('Ignored'), value: 'ignore' },
  ];
  const findFieldIdCsvIndex = (fieldId: string) => {
    const res = fieldsMapping.findIndex((id) => id === fieldId);
    if (res !== -1) {
      return res.toString();
    }
    return 'ignore';
  };
  const handleChange = (fieldId: string, columnIndex: string | null) => {
    const newFieldsMapping = [...fieldsMapping];
    const columnIndexUsingFieldId = findFieldIdCsvIndex(fieldId);
    if (columnIndexUsingFieldId !== 'ignore' || columnIndex === 'ignore') {
      newFieldsMapping[parseInt(columnIndexUsingFieldId)] = null;
    }
    if (columnIndex !== null && columnIndex !== 'ignore') {
      newFieldsMapping[parseInt(columnIndex)] = fieldId;
    }
    setFieldsMapping(newFieldsMapping);
    onChange(newFieldsMapping);
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 text-center text-sm">{t('Table')}</div>
        <ArrowLeftIcon className=" w-4 h-4 opacity-0 shrink-0" />
        <div className="flex-1 text-center text-sm">{t('CSV')}</div>
      </div>
      {fields.map((field) => (
        <div className="flex items-center gap-2" key={field.id}>
          <div className="flex-1">
            <Input value={field.name} readOnly />
          </div>
          <ArrowLeftIcon className="w-4 h-4 shrink-0" />
          <div className="flex-1">
            <SearchableSelect
              options={csvColumnsOptions}
              onChange={(value) => handleChange(field.id, value)}
              value={findFieldIdCsvIndex(field.id)}
              placeholder={t('Field')}
              showDeselect={false}
            ></SearchableSelect>
          </div>
        </div>
      ))}
    </div>
  );
};

FieldsMappingControl.displayName = 'FieldsMappingControl';
export { FieldsMappingControl };
