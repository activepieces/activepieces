import { format } from 'date-fns';
import { t } from 'i18next';
import { Trash, Calendar as CalendarIcon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Field, FieldType, FilterOperator } from '@activepieces/shared';

type FilterRowProps = {
  fields: Field[];
  onDelete: () => void;
  onChange: (fieldId: string, operator: FilterOperator, value: string) => void;
  filter?: {
    fieldId: string;
    operator: FilterOperator;
    value: string;
  };
};

export const FilterRow = ({
  fields,
  onDelete,
  onChange,
  filter,
}: FilterRowProps) => {
  const [selectedField, setSelectedField] = useState<string | undefined>(
    filter?.fieldId,
  );
  const [selectedOperator, setSelectedOperator] = useState<FilterOperator>(
    filter?.operator || FilterOperator.EQ,
  );
  const [value, setValue] = useState<string>(filter?.value || '');

  const selectedFieldType = fields.find((f) => f.id === selectedField)?.type;
  const isTextType = selectedFieldType === FieldType.TEXT;

  const handleFieldChange = (newField: string) => {
    setSelectedField(newField);
    if (newField) {
      onChange(newField, selectedOperator, value);
    }
  };

  const handleOperatorChange = (newOperator: FilterOperator) => {
    setSelectedOperator(newOperator);
    if (selectedField) {
      onChange(selectedField, newOperator, value);
    }
  };

  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    if (selectedField) {
      onChange(selectedField, selectedOperator, newValue);
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 p-2">
      <div className="flex-auto w-44">
        <Select value={selectedField} onValueChange={handleFieldChange}>
          <SelectTrigger>
            <SelectValue placeholder={t('Select field')} />
          </SelectTrigger>
          <SelectContent>
            {fields.map((field) => (
              <SelectItem key={field.id} value={field.id}>
                {field.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div
        className={`flex flex-auto items-center gap-2 ${
          !selectedField ? 'invisible' : ''
        }`}
      >
        <div className="flex-auto w-36">
          <Select value={selectedOperator} onValueChange={handleOperatorChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {!isTextType ? (
                <>
                  <SelectItem value={FilterOperator.EQ}>{t('=')}</SelectItem>
                  <SelectItem value={FilterOperator.NEQ}>{t('≠')}</SelectItem>
                  <SelectItem value={FilterOperator.GT}>{t('>')}</SelectItem>
                  <SelectItem value={FilterOperator.GTE}>{t('≥')}</SelectItem>
                  <SelectItem value={FilterOperator.LT}>{t('<')}</SelectItem>
                  <SelectItem value={FilterOperator.LTE}>{t('≤')}</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value={FilterOperator.EQ}>
                    {t('Is Exactly')}
                  </SelectItem>
                  <SelectItem value={FilterOperator.NEQ}>
                    {t('Is Not Exactly')}
                  </SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-auto w-44">
          {selectedFieldType === FieldType.DATE ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {value ? (
                    format(new Date(value), 'PPP')
                  ) : (
                    <span>{t('Pick a date')}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={new Date(value)}
                  onSelect={(date) =>
                    handleValueChange(date ? date.toISOString() : '')
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          ) : (
            <Input
              placeholder={t('Value')}
              value={value}
              type={selectedFieldType === FieldType.NUMBER ? 'number' : 'text'}
              onChange={(e) => handleValueChange(e.target.value)}
            />
          )}
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onDelete}
      >
        <Trash className="h-4 w-4" />
      </Button>
    </div>
  );
};
