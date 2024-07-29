import React from 'react';
import { ControllerRenderProps, useFormContext } from 'react-hook-form';

import { ApMarkdown } from '@/components/custom/markdown';
import { SearchableSelect } from '@/components/custom/searchable-select';
import { ArrayInput } from '@/components/ui/array-input';
import { DictionaryInput } from '@/components/ui/dictionary-input';
import { FormControl, FormField } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { AutoFormFieldWrapper } from '@/features/properties-form/components/auto-form-field-wrapper';
import {
  PieceProperty,
  PiecePropertyMap,
  PropertyType,
} from '@activepieces/pieces-framework';

type AutoFormProps = {
  props: PiecePropertyMap;
  allowDynamicValues: boolean;
  prefixValue: string;
};

const AutoPropertiesFormComponent = React.memo(
  ({ props, allowDynamicValues, prefixValue }: AutoFormProps) => {
    const form = useFormContext();

    return (
      <div className="flex flex-col gap-4 p-1">
        {Object.entries(props).map(([key]) => {
          return (
            <FormField
              key={key}
              name={prefixValue + '.' + key}
              control={form.control}
              render={({ field }) =>
                selectRightComponent(field, key, props[key], allowDynamicValues)
              }
            />
          );
        })}
      </div>
    );
  },
);

const selectRightComponent = (
  field: ControllerRenderProps<Record<string, any>, string>,
  key: string,
  property: PieceProperty,
  allowDynamicValues: boolean,
) => {
  switch (property.type) {
    case PropertyType.ARRAY:
      return (
        <AutoFormFieldWrapper
          property={property}
          allowDynamicValues={allowDynamicValues}
        >
          <ArrayInput items={[]} onChange={(items) => {}}></ArrayInput>
        </AutoFormFieldWrapper>
      );
    case PropertyType.OBJECT:
      return (
        <AutoFormFieldWrapper
          property={property}
          allowDynamicValues={allowDynamicValues}
        >
          <DictionaryInput values={{}} onChange={() => {}}></DictionaryInput>
        </AutoFormFieldWrapper>
      );
    case PropertyType.CHECKBOX:
      return (
        <AutoFormFieldWrapper
          property={property}
          allowDynamicValues={allowDynamicValues}
        >
          <FormControl>
            <Switch
              id={key}
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          </FormControl>
        </AutoFormFieldWrapper>
      );
    case PropertyType.MARKDOWN:
      return <ApMarkdown markdown={property.description} />;
    case PropertyType.STATIC_DROPDOWN:
      return (
        <AutoFormFieldWrapper
          property={property}
          allowDynamicValues={allowDynamicValues}
        >
          <SearchableSelect
            options={property.options.options}
            onChange={field.onChange}
            value={field.value}
            placeholder={property.options.placeholder ?? 'Select a option'}
          ></SearchableSelect>
        </AutoFormFieldWrapper>
      );
    case PropertyType.DATE_TIME:
    case PropertyType.SHORT_TEXT:
    case PropertyType.LONG_TEXT:
    case PropertyType.FILE:
    case PropertyType.NUMBER:
    case PropertyType.JSON:
    case PropertyType.MULTI_SELECT_DROPDOWN:
    case PropertyType.STATIC_MULTI_SELECT_DROPDOWN:
    case PropertyType.DROPDOWN:
    case PropertyType.DYNAMIC:
    case PropertyType.SECRET_TEXT:
      return (
        <AutoFormFieldWrapper
          property={property}
          allowDynamicValues={allowDynamicValues}
        >
          <Input {...field} id={key} type="text" />
        </AutoFormFieldWrapper>
      );

    case PropertyType.CUSTOM_AUTH:
    case PropertyType.BASIC_AUTH:
    case PropertyType.OAUTH2:
      return <></>;
  }
};
AutoPropertiesFormComponent.displayName = 'AutoFormComponent';
export { AutoPropertiesFormComponent };
