import { t } from 'i18next';
import { Plus, TrashIcon } from 'lucide-react';
import { nanoid } from 'nanoid';
import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { ArrayInput } from '@/components/custom/array-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
      case PropertyType.JSON:
      case PropertyType.COLOR:
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
      case PropertyType.DATE_TIME:
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
      const formValues = form.getValues(inputName) || [];
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

    return (
      <>
        {arrayProperty.properties && (
          <>
            <div className="flex w-full flex-col gap-4">
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
                    onValueChange={() => {
                      form.trigger(inputName);
                    }}
                  ></AutoPropertiesFormComponent>
                </div>
              ))}
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
        )}

        {!arrayProperty.properties && (
          <ArrayInput
            inputName={inputName}
            disabled={disabled}
            required={arrayProperty.required}
            customInputNode={(onChange, value, disabled) => {
              if (!useMentionTextInput) {
                return (
                  <Input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                  />
                );
              }
              return (
                <TextInputWithMentions
                  initialValue={value}
                  onChange={(newValue) => onChange(newValue)}
                  disabled={disabled}
                />
              );
            }}
          />
        )}
      </>
    );
  },
);

ArrayPieceProperty.displayName = 'ArrayPieceProperty';
export { ArrayPieceProperty };
