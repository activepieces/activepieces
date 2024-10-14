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
import {
  ArrayProperty,
  ArraySubProps,
  PropertyType,
} from '@activepieces/pieces-framework';

import { AutoPropertiesFormComponent } from './auto-properties-form';
import { TextInputWithMentions } from './text-input-with-mentions';

type ArrayPropertyProps = {
  inputName: string;
  useMentionTextInput: boolean;
  arrayProperty: ArrayProperty<boolean>;
  disabled: boolean;
};

type ArrayField = {
  id: string;
  value: string | Record<string, unknown>;
};

const getDefaultValuesForInputs = (arrayProperties: ArraySubProps<boolean>) => {
  return Object.entries(arrayProperties).reduce((acc, [key, value]) => {
    switch (value.type) {
      case PropertyType.LONG_TEXT:
      case PropertyType.SHORT_TEXT:
      case PropertyType.NUMBER:
        return {
          ...acc,
          [key]: '',
        };
      case PropertyType.CHECKBOX:
        return {
          ...acc,
          [key]: false,
        };
      case PropertyType.STATIC_DROPDOWN:
      case PropertyType.STATIC_MULTI_SELECT_DROPDOWN:
      case PropertyType.MULTI_SELECT_DROPDOWN:
        return {
          ...acc,
          [key]: null,
        };
      case PropertyType.FILE:
        return {
          ...acc,
          [key]: null,
        };
    }
  }, {} as Record<string, unknown>);
};
const ArrayPieceProperty = React.memo(
  ({
    inputName,
    useMentionTextInput,
    disabled,
    arrayProperty,
  }: ArrayPropertyProps) => {
    const form = useFormContext();
    const [fields, setFields] = useState<ArrayField[]>(() => {
      const formValues = form.getValues(inputName);
      if (formValues) {
        return formValues.map((value: string | Record<string, unknown>) => ({
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
      //passing empty object will result in react form putting in the initial values when the user first started editing
      const value = arrayProperty.properties
        ? getDefaultValuesForInputs(arrayProperty.properties)
        : '';
      const formValues = form.getValues(inputName);
      const newFields = [
        ...formValues.map((value: string | Record<string, unknown>) => ({
          id: nanoid(),
          value,
        })),
        { id: nanoid(), value },
      ];

      setFields(newFields);
      updateFormValue(newFields);
    };

    const remove = (index: number) => {
      const currentFields: ArrayField[] = form
        .getValues(inputName)
        .map((value: string | Record<string, unknown>) => ({
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

    const updateFieldValue = (
      index: number,
      newValue: string | Record<string, unknown>,
    ) => {
      const newFields = fields.map((field, i) =>
        i === index ? { ...field, value: newValue } : field,
      );
      setFields(newFields);
      updateFormValue(newFields);
    };

    return (
      <>
        <div className="flex w-full flex-col gap-4">
          {arrayProperty.properties ? (
            <>
              {fields.map((field, index) => (
                <div
                  className="p-4 border rounded-md flex flex-col gap-4"
                  key={'array-item-' + field.id}
                >
                  <div className="flex justify-between">
                    <div className="font-semibold"> #{index + 1}</div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8 shrink-0"
                      onClick={() => {
                        remove(index);
                      }}
                      disabled={disabled}
                    >
                      <TrashIcon
                        className="size-4 text-destructive"
                        aria-hidden="true"
                      />
                      <span className="sr-only">{t('Remove')}</span>
                    </Button>
                  </div>
                  <AutoPropertiesFormComponent
                    prefixValue={`${inputName}.[${index}]`}
                    props={arrayProperty.properties!}
                    useMentionTextInput={useMentionTextInput}
                    allowDynamicValues={false}
                    disabled={disabled}
                  ></AutoPropertiesFormComponent>
                </div>
              ))}
            </>
          ) : (
            <Sortable
              value={fields}
              onMove={({ activeIndex, overIndex }) => {
                move(activeIndex, overIndex);
              }}
              overlay={
                <div className="grid grid-cols-[auto,1fr,auto] items-center gap-2">
                  <div className="size-8 shrink-0 rounded-sm bg-primary/10" />
                  <div className="h-8 w-full rounded-sm bg-primary/10" />
                  <div className="size-8 shrink-0 rounded-sm bg-primary/10" />
                </div>
              }
            >
              {fields.map((field, index) => (
                <SortableItem key={field.id} value={field.id} asChild>
                  <div className="flex items-center gap-3">
                    <SortableDragHandle
                      variant="outline"
                      size="icon"
                      disabled={disabled}
                      className="size-8 shrink-0"
                    >
                      <DragHandleDots2Icon
                        className="size-4"
                        aria-hidden="true"
                      />
                    </SortableDragHandle>
                    {arrayProperty.properties && (
                      <div className="flex flex-grow">
                        <AutoPropertiesFormComponent
                          prefixValue={`${inputName}.${index}`}
                          props={arrayProperty.properties}
                          useMentionTextInput={useMentionTextInput}
                          allowDynamicValues={false}
                          disabled={disabled}
                        ></AutoPropertiesFormComponent>
                      </div>
                    )}
                    {!arrayProperty.properties && (
                      <FormField
                        control={form.control}
                        name={`${inputName}.${index}`}
                        render={() => (
                          <FormItem className="grow">
                            <FormControl>
                              {useMentionTextInput ? (
                                <TextInputWithMentions
                                  initialValue={field.value as string}
                                  onChange={(value) =>
                                    updateFieldValue(index, value)
                                  }
                                  disabled={disabled}
                                />
                              ) : (
                                <Input
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
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={disabled}
                      className="size-8 shrink-0"
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
                  </div>
                </SortableItem>
              ))}
            </Sortable>
          )}
        </div>
        {!disabled && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
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

ArrayPieceProperty.displayName = 'ArrayPieceProperty';
export { ArrayPieceProperty };
