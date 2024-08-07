import { Plus, TrashIcon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TextWithIcon } from '@/components/ui/text-with-icon';

import { TextInputWithMentions } from './text-input-with-mentions/text-input-with-mentions';

type DictionaryInputItem = {
  key: string;
  value: string;
};

type DictionaryInputProps = {
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  useMentionTextInput?: boolean;
};

export const DictionaryProperty = ({
  values,
  onChange,
  useMentionTextInput,
}: DictionaryInputProps) => {
  const [formValue, setFormValue] = useState<DictionaryInputItem[]>(
    Object.keys(values).map((key) => ({ key, value: values[key] })),
  );

  const remove = (index: number) => {
    const newValues = formValue.filter((_, i) => i !== index);
    updateValue(newValues);
  };

  const add = () => {
    updateValue([...formValue, { key: '', value: '' }]);
  };

  const onChangeValue = (
    index: number,
    value: string | undefined,
    key: string | undefined,
  ) => {
    const newValues = [...formValue];
    if (value !== undefined) {
      newValues[index].value = value;
    }
    if (key !== undefined) {
      newValues[index].key = key;
    }
    updateValue(newValues);
  };

  const updateValue = (items: DictionaryInputItem[]) => {
    setFormValue(items);
    onChange(
      items.reduce(
        (acc, current) => ({ ...acc, [current.key]: current.value }),
        {},
      ),
    );
  };

  return (
    <div className="flex w-full flex-col gap-4">
      {formValue.map(({ key, value }, index) => (
        <div
          key={'dictionary-input-' + index}
          className="flex items-center gap-3 items-center"
        >
          <Input
            value={key}
            className="basis-[50%] h-full max-w-[50%]"
            onChange={(e) => onChangeValue(index, undefined, e.target.value)}
          />
          <div className="basis-[50%] max-w-[50%]">
            {useMentionTextInput ? (
              <TextInputWithMentions
                initialValue={value}
                onChange={(e) => onChangeValue(index, e, undefined)}
              ></TextInputWithMentions>
            ) : (
              <Input
                value={value}
                onChange={(e) =>
                  onChangeValue(index, undefined, e.target.value)
                }
              ></Input>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8 shrink-0"
            onClick={() => remove(index)}
          >
            <TrashIcon className="size-4 text-destructive" aria-hidden="true" />
            <span className="sr-only">Remove</span>
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add} type="button">
        <TextWithIcon icon={<Plus size={18} />} text="Add Item" />
      </Button>
    </div>
  );
};
