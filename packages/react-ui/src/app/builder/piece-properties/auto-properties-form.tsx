import React from 'react';
import { ControllerRenderProps, useFormContext } from 'react-hook-form';

import { JsonEditor } from '@/components/custom/json-editior';
import { ApMarkdown } from '@/components/custom/markdown';
import { SearchableSelect } from '@/components/custom/searchable-select';
import { FormControl, FormField } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  OAuth2Props,
  PieceProperty,
  PiecePropertyMap,
  PropertyType,
  ArraySubProps,
} from '@activepieces/pieces-framework';

import { ArrayPieceProperty } from './array-property';
import { AutoFormFieldWrapper } from './auto-form-field-wrapper';
import { DictionaryProperty } from './dictionary-property';
import { DynamicDropdownPieceProperty } from './dynamic-dropdown-piece-property';
import { DynamicProperties } from './dynamic-piece-property';
import { MultiSelectPieceProperty } from './multi-select-piece-property';
import { TextInputWithMentions } from './text-input-with-mentions';

type AutoFormProps = {
  props: PiecePropertyMap | OAuth2Props | ArraySubProps<boolean>;
  allowDynamicValues: boolean;
  prefixValue: string;
  markdownVariables?: Record<string, string>;
  useMentionTextInput: boolean;
  disabled?: boolean;
};

const AutoPropertiesFormComponent = React.memo(
  ({
    markdownVariables,
    props,
    allowDynamicValues,
    prefixValue,
    disabled,
    useMentionTextInput,
  }: AutoFormProps) => {
    const form = useFormContext();

    return (
      <div className="flex flex-col gap-4 p-1 w-full">
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
                  markdownVariables ?? {},
                  useMentionTextInput,
                  disabled ?? false,
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
  markdownVariables: Record<string, string>,
  useMentionTextInput: boolean,
  disabled: boolean,
) => {
  switch (property.type) {
    case PropertyType.ARRAY:
      return (
        <AutoFormFieldWrapper
          property={property}
          propertyKey={key}
          field={field}
          disabled={disabled}
          allowDynamicValues={allowDynamicValues}
        >
          <ArrayPieceProperty
            disabled={disabled}
            arrayProperty={property}
            inputName={inputName}
            useMentionTextInput={useMentionTextInput}
          ></ArrayPieceProperty>
        </AutoFormFieldWrapper>
      );
    case PropertyType.OBJECT:
      return (
        <AutoFormFieldWrapper
          property={property}
          propertyKey={key}
          field={field}
          disabled={disabled}
          allowDynamicValues={allowDynamicValues}
        >
          <DictionaryProperty
            disabled={disabled}
            values={field.value}
            onChange={field.onChange}
            useMentionTextInput={useMentionTextInput}
          ></DictionaryProperty>
        </AutoFormFieldWrapper>
      );
    case PropertyType.CHECKBOX:
      return (
        <AutoFormFieldWrapper
          property={property}
          propertyKey={key}
          disabled={disabled}
          field={field}
          allowDynamicValues={allowDynamicValues}
        >
          <FormControl>
            <Switch
              id={key}
              checked={field.value}
              disabled={disabled}
              onCheckedChange={field.onChange}
            />
          </FormControl>
        </AutoFormFieldWrapper>
      );
    case PropertyType.MARKDOWN:
      return (
        <ApMarkdown
          markdown={property.description}
          variables={markdownVariables}
        />
      );
    case PropertyType.STATIC_DROPDOWN:
      return (
        <AutoFormFieldWrapper
          property={property}
          propertyKey={key}
          field={field}
          disabled={disabled}
          allowDynamicValues={allowDynamicValues}
        >
          <SearchableSelect
            options={property.options.options}
            onChange={field.onChange}
            value={field.value}
            disabled={disabled}
            placeholder={property.options.placeholder ?? 'Select an option'}
          ></SearchableSelect>
        </AutoFormFieldWrapper>
      );
    case PropertyType.JSON:
      return (
        <AutoFormFieldWrapper
          propertyKey={key}
          property={property}
          field={field}
          disabled={disabled}
          allowDynamicValues={allowDynamicValues}
        >
          <JsonEditor field={field} readonly={disabled}></JsonEditor>
        </AutoFormFieldWrapper>
      );
    case PropertyType.STATIC_MULTI_SELECT_DROPDOWN:
      return (
        <AutoFormFieldWrapper
          property={property}
          propertyKey={key}
          field={field}
          disabled={disabled}
          allowDynamicValues={allowDynamicValues}
        >
          <MultiSelectPieceProperty
            placeholder={property.options.placeholder ?? 'Select an option'}
            options={property.options.options}
            onChange={field.onChange}
            initialValues={field.value}
            disabled={disabled}
          ></MultiSelectPieceProperty>
        </AutoFormFieldWrapper>
      );
    case PropertyType.MULTI_SELECT_DROPDOWN:
    case PropertyType.DROPDOWN:
      return (
        <AutoFormFieldWrapper
          property={property}
          propertyKey={key}
          field={field}
          disabled={disabled}
          allowDynamicValues={allowDynamicValues}
        >
          <DynamicDropdownPieceProperty
            refreshers={property.refreshers}
            initialValue={field.value}
            onChange={field.onChange}
            disabled={disabled}
            propertyName={key}
          ></DynamicDropdownPieceProperty>
        </AutoFormFieldWrapper>
      );
    case PropertyType.DATE_TIME:
    case PropertyType.SHORT_TEXT:
    case PropertyType.LONG_TEXT:
    case PropertyType.FILE:
    case PropertyType.NUMBER:
    case PropertyType.SECRET_TEXT:
      return (
        <AutoFormFieldWrapper
          property={property}
          field={field}
          propertyKey={key}
          disabled={disabled}
          allowDynamicValues={allowDynamicValues}
        >
          {useMentionTextInput ? (
            <TextInputWithMentions
              disabled={disabled}
              initialValue={field.value}
              onChange={field.onChange}
            ></TextInputWithMentions>
          ) : (
            <Input
              value={field.value}
              onChange={field.onChange}
              disabled={disabled}
            ></Input>
          )}
        </AutoFormFieldWrapper>
      );
    case PropertyType.DYNAMIC:
      return (
        <AutoFormFieldWrapper
          propertyKey={key}
          property={property}
          field={field}
          disabled={disabled}
          allowDynamicValues={allowDynamicValues}
        >
          <DynamicProperties
            refreshers={property.refreshers}
            propertyName={key}
            disabled={disabled}
          ></DynamicProperties>
        </AutoFormFieldWrapper>
      );
    case PropertyType.CUSTOM_AUTH:
    case PropertyType.BASIC_AUTH:
    case PropertyType.OAUTH2:
      return null;
  }
};
AutoPropertiesFormComponent.displayName = 'AutoFormComponent';
export { AutoPropertiesFormComponent };
