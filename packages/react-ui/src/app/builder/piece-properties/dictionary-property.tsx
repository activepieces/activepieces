import { t } from 'i18next';
import { Plus, TrashIcon } from 'lucide-react';
import { nanoid } from 'nanoid';
import { useEffect, useState } from 'react';

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
  const [formValue, setFormValue] = useState<DictionaryInputItem[]>(() => {
    return Object.entries(values ?? {}).map(([key, value]) => ({
      key,
      value,
      id: nanoid(),
    }));
  });

  useEffect(() => {
    const newFormValue = Object.entries(values ?? {}).map(([key, value]) => ({
      key,
      value,
      id: nanoid(),
    }));

    const areEqual = (a: DictionaryInputItem[], b: DictionaryInputItem[]) => {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (a[i].key !== b[i].key || a[i].value !== b[i].value) {
          return false;
        }
      }
      return true;
    };

    if (!areEqual(newFormValue, formValue)) {
      setFormValue(newFormValue);
    }
  }, [values]);

  const remove = (index: number) => {
    const newValues = formValue.filter((_, i) => i !== index);
    setFormValue(newValues);
    updateValue(newValues);
  };

  const add = () => {
    const newValues = [...formValue, { key: '', value: '', id: nanoid() }];
    updateValue(newValues);
    setFormValue(newValues);
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
    onChange(
      items.reduce(
        (acc, current) => ({ ...acc, [current.key]: current.value }),
        {},
      ),
    );
  };

  return (
    <div className="flex w-full flex-col gap-4">
      {formValue.map(({ key, value, id }, index) => (
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
