import React from 'react';
import { ControllerRenderProps, useFormContext } from 'react-hook-form';

import { JsonEditor } from '@/components/custom/json-editior';
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

import { MultiSelectPieceProperty } from './multi-select-piece-property';
import { SelectPieceProperty } from './select-piece-property';
import { TextInputWithMentions } from '@/app/builder/text-input-with-mentions/text-input-with-mentions';

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
                selectRightComponent(
                  field,
                  key,
                  prefixValue + '.' + key,
                  props[key],
                  allowDynamicValues,
                )
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
  inputName: string,
  property: PieceProperty,
  allowDynamicValues: boolean,
) => {
  switch (property.type) {
    case PropertyType.ARRAY:
      return (
        <AutoFormFieldWrapper
          property={property}
          propertyKey={key}
          field={field}
          allowDynamicValues={allowDynamicValues}
        >
          <ArrayInput inputName={inputName}></ArrayInput>
        </AutoFormFieldWrapper>
      );
    case PropertyType.OBJECT:
      return (
        <AutoFormFieldWrapper
          property={property}
          propertyKey={key}
          field={field}
          allowDynamicValues={allowDynamicValues}
        >
          <DictionaryInput
            values={field.value}
            onChange={field.onChange}
          ></DictionaryInput>
        </AutoFormFieldWrapper>
      );
    case PropertyType.CHECKBOX:
      return (
        <AutoFormFieldWrapper
          property={property}
          propertyKey={key}
          field={field}
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
          propertyKey={key}
          field={field}
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
    case PropertyType.JSON:
      return (
        <AutoFormFieldWrapper
          property={property}
          propertyKey={key}
          field={field}
          allowDynamicValues={allowDynamicValues}
        >
          <JsonEditor
            intialValue={field.value}
            onChange={field.onChange}
          ></JsonEditor>
        </AutoFormFieldWrapper>
      );
    case PropertyType.STATIC_MULTI_SELECT_DROPDOWN:
      return (
        <AutoFormFieldWrapper
          property={property}
          propertyKey={key}
          field={field}
          allowDynamicValues={allowDynamicValues}
        >
          <MultiSelectPieceProperty
            placeholder={property.options.placeholder ?? 'Select a option'}
            options={property.options.options}
            onChange={field.onChange}
            initialValues={field.value}
            disabled={property.options.disabled}
          ></MultiSelectPieceProperty>
        </AutoFormFieldWrapper>
      );
    case PropertyType.DROPDOWN:
      return (
        <AutoFormFieldWrapper
          property={property}
          propertyKey={key}
          field={field}
          allowDynamicValues={allowDynamicValues}
        >
          <SelectPieceProperty
            refreshers={property.refreshers}
            intialValue={field.value}
            onChange={field.onChange}
            propertyName={key}
          ></SelectPieceProperty>
        </AutoFormFieldWrapper>
      );
    case PropertyType.DATE_TIME:
    case PropertyType.SHORT_TEXT:
    case PropertyType.LONG_TEXT:
    case PropertyType.FILE:
    case PropertyType.NUMBER:
    case PropertyType.MULTI_SELECT_DROPDOWN:
    case PropertyType.DYNAMIC:
    case PropertyType.SECRET_TEXT:
      return (
        <AutoFormFieldWrapper
          property={property}
          field={field}
          propertyKey={key}
          allowDynamicValues={allowDynamicValues}
        >
          <TextInputWithMentions
            initialValue={field.value}
            onChange={field.onChange}
          ></TextInputWithMentions> 
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
