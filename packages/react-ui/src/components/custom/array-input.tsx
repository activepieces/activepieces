import { DragHandleDots2Icon } from '@radix-ui/react-icons';
import { t } from 'i18next';
import { Plus, TrashIcon } from 'lucide-react';
import { nanoid } from 'nanoid';
import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Sortable,
  SortableDragHandle,
  SortableItem,
} from '@/components/ui/sortable';
import { TextWithIcon } from '@/components/ui/text-with-icon';
import { cn } from '@/lib/utils';

type ArrayInputProps = {
  inputName: string;
  disabled: boolean;
  required?: boolean;
  customInputNode?: (
    onChange: (value: string) => void,
    value: string,
    disabled: boolean,
  ) => React.ReactNode;
  thinInputs?: boolean;
};

type ArrayField = {
  id: string;
  value: string;
};

const ArrayInput = React.memo(
  ({
    inputName,
    disabled,
    required,
    customInputNode,
    thinInputs,
  }: ArrayInputProps) => {
    const form = useFormContext();
    const [fields, setFields] = useState<ArrayField[]>(() => {
      const formValues = form.getValues(inputName);
      if (formValues) {
        return formValues.map((value: string) => ({
          id: nanoid(),
          value,
        }));
      } else {
        return [];
      }
    });

    const updateFormValue = (newFields: ArrayField[]) => {
      form.setValue(
        inputName,
        newFields.map((f) => f.value),
        { shouldValidate: true },
      );
    };

    const append = () => {
      const formValues = form.getValues(inputName) || [];
      const newFields = [
        ...formValues.map((value: string) => ({
          id: nanoid(),
          value,
        })),
        { id: nanoid(), value: '' },
      ];

      setFields(newFields);
      updateFormValue(newFields);
    };

    const remove = (index: number) => {
      const currentFields: ArrayField[] = form
        .getValues(inputName)
        .map((value: string) => ({
          id: nanoid(),
          value,
        }));
      const newFields = currentFields.filter((_, i) => i !== index);
      setFields(newFields);
      updateFormValue(newFields);
    };

    const move = (from: number, to: number) => {
      const newFields = [...fields];
      const [removed] = newFields.splice(from, 1);
      newFields.splice(to, 0, removed);
      setFields(newFields);
      updateFormValue(newFields);
    };

    const updateFieldValue = (index: number, newValue: string) => {
      const newFields = fields.map((field, i) =>
        i === index ? { ...field, value: newValue } : field,
      );
      setFields(newFields);
      updateFormValue(newFields);
    };
    const showRemoveButton = !required || fields.length > 1;

    return (
      <>
        <div className="flex w-full flex-col gap-4 ">
          <Sortable
            value={fields}
            onMove={({ activeIndex, overIndex }) => {
              move(activeIndex, overIndex);
            }}
          >
            {fields.map((field, index) => (
              <SortableItem key={field.id} value={field.id} asChild>
                <div className="flex items-center gap-3">
                  <SortableDragHandle
                    variant="outline"
                    size="icon"
                    disabled={disabled}
                    className={cn('shrink-0 size-8', thinInputs && 'size-7')}
                  >
                    <DragHandleDots2Icon
                      className="size-4"
                      aria-hidden="true"
                    />
                  </SortableDragHandle>

                  <FormField
                    control={form.control}
                    name={`${inputName}.${index}`}
                    render={() => (
                      <FormItem className="grow">
                        <FormControl>
                          {customInputNode ? (
                            customInputNode(
                              (value) => updateFieldValue(index, value),
                              field.value as string,
                              disabled,
                            )
                          ) : (
                            <Input
                              thin={thinInputs}
                              value={field.value as string}
                              onChange={(e) =>
                                updateFieldValue(index, e.target.value)
                              }
                              disabled={disabled}
                              className="grow"
                            />
                          )}
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {showRemoveButton && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={disabled}
                      className={cn('shrink-0 size-8', thinInputs && 'size-7')}
                      onClick={() => {
                        remove(index);
                      }}
                    >
                      <TrashIcon
                        className="size-4 text-destructive"
                        aria-hidden="true"
                      />
                      <span className="sr-only">{t('Remove')}</span>
                    </Button>
                  )}
                </div>
              </SortableItem>
            ))}
          </Sortable>
        </div>
        {!disabled && (
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              append();
            }}
            type="button"
          >
            <TextWithIcon icon={<Plus size={18} />} text={t('Add Item')} />
          </Button>
        )}
      </>
    );
  },
);

ArrayInput.displayName = 'ArrayInput';
export { ArrayInput };
