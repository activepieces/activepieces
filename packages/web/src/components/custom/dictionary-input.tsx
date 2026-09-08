import { t } from 'i18next';
import { Plus, TrashIcon } from 'lucide-react';
import { useRef } from 'react';

import { TextWithIcon } from '@/components/custom/text-with-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type DictionaryInputItem = {
  key: string;
  value: string;
  id: string;
};

export const DictionaryInput = ({
  values,
  onChange,
  disabled,
  renderValueInput,
  keyInputClassName,
  keyPlaceholder,
  valuePlaceholder,
}: DictionaryInputProps) => {
  const id = useRef(1);
  const valuesArrayRef = useRef<DictionaryInputItem[]>([]);
  const incomingValues = values ?? {};
  const currentValues = toRecord(valuesArrayRef.current);
  const haveValuesChangedFromOutside =
    Object.keys(currentValues).length !== Object.keys(incomingValues).length ||
    Object.entries(incomingValues).some(
      ([key, value]) => !(key in currentValues) || currentValues[key] !== value,
    );

  if (haveValuesChangedFromOutside) {
    valuesArrayRef.current = Object.entries(incomingValues)
      .sort(([firstKey], [secondKey]) => compareKeys(firstKey, secondKey))
      .map(([key, value]) => {
        id.current++;
        return {
          key,
          value,
          id: `${id.current}`,
        };
      });
  }

  const remove = (index: number) => {
    const newValues = valuesArrayRef.current.filter((_, i) => i !== index);
    valuesArrayRef.current = newValues;
    updateValue(newValues);
  };
  const add = () => {
    id.current++;
    const newValues = [
      ...valuesArrayRef.current,
      { key: '', value: '', id: `${id.current}` },
    ];
    valuesArrayRef.current = newValues;
    updateValue(newValues);
  };

  const onChangeValue = (
    index: number,
    value: string | undefined,
    key: string | undefined,
  ) => {
    const newValues = [...valuesArrayRef.current];
    if (value !== undefined) {
      newValues[index].value = value;
    }
    if (key !== undefined) {
      newValues[index].key = key;
    }
    valuesArrayRef.current = newValues;
    updateValue(newValues);
  };

  const updateValue = (items: DictionaryInputItem[]) => {
    // Wrap in event-like object so RHF's field.onChange correctly extracts
    // target.value instead of treating the record itself as an event.
    // See: https://github.com/react-hook-form/react-hook-form/issues/13078
    onChange({ target: { value: toRecord(items) } });
  };

  return (
    <div className={cn('flex w-full flex-col gap-2')}>
      {valuesArrayRef.current.map(({ key, value, id }, index) => (
        <div
          key={'dictionary-input-' + id}
          className="flex items-center gap-3 items-center"
        >
          <Input
            value={key}
            disabled={disabled}
            placeholder={keyPlaceholder}
            className={cn('basis-[50%] max-w-[50%]', keyInputClassName)}
            onChange={(e) => onChangeValue(index, undefined, e.target.value)}
          />
          <div className="basis-[50%] max-w-[50%]">
            {renderValueInput ? (
              renderValueInput({
                value,
                onChange: (v) => onChangeValue(index, v, undefined),
                disabled,
              })
            ) : (
              <Input
                value={value}
                disabled={disabled}
                placeholder={valuePlaceholder}
                onChange={(e) =>
                  onChangeValue(index, e.target.value, undefined)
                }
              />
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8 shrink-0"
            disabled={disabled}
            onClick={() => remove(index)}
          >
            <TrashIcon className="size-4 text-destructive" aria-hidden="true" />
            <span className="sr-only">{t('Remove')}</span>
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={add}
        type="button"
        disabled={disabled}
      >
        <TextWithIcon icon={<Plus size={18} />} text={t('Add Item')} />
      </Button>
    </div>
  );
};

const keyCollator = new Intl.Collator('en', { numeric: true });

function compareKeys(firstKey: string, secondKey: string): number {
  if (firstKey === '' || secondKey === '') {
    return firstKey === secondKey ? 0 : firstKey === '' ? 1 : -1;
  }
  const humanOrder = keyCollator.compare(firstKey, secondKey);
  if (humanOrder !== 0) {
    return humanOrder;
  }
  return firstKey < secondKey ? -1 : firstKey > secondKey ? 1 : 0;
}

function toRecord(items: DictionaryInputItem[]): Record<string, string> {
  return Object.fromEntries(
    items.map((item): [string, string] => [item.key, item.value]),
  );
}

export type DictionaryInputProps = {
  values: Record<string, string> | undefined;
  onChange: (event: { target: { value: Record<string, string> } }) => void;
  disabled?: boolean;
  keyInputClassName?: string;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  renderValueInput?: (params: {
    value: string;
    onChange: (v: string) => void;
    disabled?: boolean;
  }) => React.ReactNode;
};
