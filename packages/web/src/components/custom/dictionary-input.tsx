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
  const valuesArray = Object.entries(values ?? {}).map((el) => {
    id.current++;
    return {
      key: el[0],
      value: el[1],
      id: `${id.current}`,
    };
  });
  const valuesArrayRef = useRef(valuesArray);
  // To allow keys that have the same prefix to be added in any order
  const valuesArrayRefUnique = valuesArrayRef.current
    .toReversed()
    .filter(
      (el, index, self) => self.findIndex((t) => t.key === el.key) === index,
    )
    .toReversed();
  const haveValuesChangedFromOutside =
    valuesArrayRefUnique.length !== valuesArray.length ||
    valuesArray.reduce((acc, _, index) => {
      return (
        acc ||
        valuesArrayRefUnique[index].key !== valuesArray[index].key ||
        valuesArrayRefUnique[index].value !== valuesArray[index].value
      );
    }, false);

  if (haveValuesChangedFromOutside) {
    valuesArrayRef.current = valuesArray;
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
    const value = items.reduce((acc, current) => {
      return { ...acc, [current.key]: current.value };
    }, {});
    // Wrap in event-like object so RHF's field.onChange correctly extracts
    // target.value instead of treating the record itself as an event.
    // See: https://github.com/react-hook-form/react-hook-form/issues/13078
    onChange({ target: { value } } as unknown as Record<string, string>);
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

export type DictionaryInputProps = {
  values: Record<string, string> | undefined;
  onChange: (values: Record<string, string>) => void;
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
