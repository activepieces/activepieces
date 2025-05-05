import { t } from 'i18next';
import { Plus, TrashIcon } from 'lucide-react';
import { useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TextWithIcon } from '@/components/ui/text-with-icon';

import { TextInputWithMentions } from './text-input-with-mentions';

type DictionaryInputItem = {
  key: string;
  value: string;
  id: string;
};

type DictionaryInputProps = {
  values: Record<string, string> | undefined;
  onChange: (values: Record<string, string>) => void;
  disabled?: boolean;
  useMentionTextInput?: boolean;
};

export const DictionaryProperty = ({
  values,
  onChange,
  disabled,
  useMentionTextInput,
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
    onChange(
      items.reduce((acc, current) => {
        return { ...acc, [current.key]: current.value };
      }, {}),
    );
  };
  return (
    <div className="flex w-full flex-col gap-4">
      {valuesArrayRef.current.map(({ key, value, id }, index) => (
        <div
          key={'dictionary-input-' + id}
          className="flex items-center gap-3 items-center"
        >
          <Input
            value={key}
            disabled={disabled}
            className="basis-[50%] h-full max-w-[50%]"
            onChange={(e) => onChangeValue(index, undefined, e.target.value)}
          />
          <div className="basis-[50%] max-w-[50%]">
            {useMentionTextInput ? (
              <TextInputWithMentions
                initialValue={value}
                disabled={disabled}
                onChange={(e) => onChangeValue(index, e, undefined)}
              ></TextInputWithMentions>
            ) : (
              <Input
                value={value}
                disabled={disabled}
                className="h-full"
                onChange={(e) =>
                  onChangeValue(index, e.target.value, undefined)
                }
              ></Input>
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
