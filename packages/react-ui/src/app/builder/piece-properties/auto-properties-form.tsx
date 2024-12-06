import { t } from 'i18next';
import React from 'react';
import { ControllerRenderProps, useFormContext } from 'react-hook-form';

import { JsonEditor } from '@/components/custom/json-editor';
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
import { isNil } from '@activepieces/shared';

import { MultiSelectPieceProperty } from '../../../components/custom/multi-select-piece-property';

import { ArrayPieceProperty } from './array-property';
import { AutoFormFieldWrapper } from './auto-form-field-wrapper';
import { BuilderJsonEditorWrapper } from './builder-json-wrapper';
import { DictionaryProperty } from './dictionary-property';
import { DynamicDropdownPieceProperty } from './dynamic-dropdown-piece-property';
import { DynamicProperties } from './dynamic-piece-property';
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
      <div className="flex flex-col gap-4 w-full">
        {Object.entries(props).map(([propertyName]) => {
          return (
            <FormField
              key={propertyName}
              name={`${prefixValue}.${propertyName}`}
              control={form.control}
              render={({ field }) =>
                selectFormComponentForProperty({
                  field,
                  propertyName,
                  inputName: `${prefixValue}.${propertyName}`,
                  property: props[propertyName],
                  allowDynamicValues,
                  markdownVariables: markdownVariables ?? {},
                  useMentionTextInput: useMentionTextInput,
                  disabled: disabled ?? false,
                })
              }
            />
          );
        })}
      </div>
    );
  },
);

type selectFormComponentForPropertyParams = {
  field: ControllerRenderProps<Record<string, any>, string>;
  propertyName: string;
  inputName: string;
  property: PieceProperty;
  allowDynamicValues: boolean;
  markdownVariables: Record<string, string>;
  useMentionTextInput: boolean;
  disabled: boolean;
};

const selectFormComponentForProperty = ({
  field,
  propertyName,
  inputName,
  property,
  allowDynamicValues,
  markdownVariables,
  useMentionTextInput,
  disabled,
}: selectFormComponentForPropertyParams) => {
  switch (property.type) {
    case PropertyType.ARRAY:
      return (
        <AutoFormFieldWrapper
          property={property}
          propertyName={propertyName}
          field={field}
          disabled={disabled}
          inputName={inputName}
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
          propertyName={propertyName}
          field={field}
          inputName={inputName}
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
          propertyName={propertyName}
          disabled={disabled}
          field={field}
          inputName={inputName}
          allowDynamicValues={allowDynamicValues}
          placeBeforeLabelText={true}
        >
          <FormControl>
            <Switch
              id={propertyName}
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
          variant={property.variant}
        />
      );
    case PropertyType.STATIC_DROPDOWN:
      return (
        <AutoFormFieldWrapper
          property={property}
          propertyName={propertyName}
          inputName={inputName}
          field={field}
          disabled={disabled}
          allowDynamicValues={allowDynamicValues}
        >
          <SearchableSelect
            options={property.options.options}
            onChange={field.onChange}
            value={field.value}
            disabled={disabled}
            placeholder={property.options.placeholder ?? t('Select an option')}
            showDeselect={!property.required}
          ></SearchableSelect>
        </AutoFormFieldWrapper>
      );
    case PropertyType.JSON:
      return (
        <AutoFormFieldWrapper
          propertyName={propertyName}
          inputName={inputName}
          property={property}
          field={field}
          disabled={disabled}
          allowDynamicValues={allowDynamicValues}
        >
          {useMentionTextInput ? (
            <BuilderJsonEditorWrapper
              field={field}
              disabled={disabled}
            ></BuilderJsonEditorWrapper>
          ) : (
            <JsonEditor field={field} readonly={disabled}></JsonEditor>
          )}
        </AutoFormFieldWrapper>
      );
    case PropertyType.STATIC_MULTI_SELECT_DROPDOWN:
      return (
        <AutoFormFieldWrapper
          property={property}
          inputName={inputName}
          propertyName={propertyName}
          field={field}
          disabled={disabled}
          allowDynamicValues={allowDynamicValues}
        >
          <MultiSelectPieceProperty
            placeholder={property.options.placeholder ?? t('Select an option')}
            options={property.options.options}
            onChange={field.onChange}
            initialValues={field.value}
            disabled={disabled}
            showDeselect={
              !isNil(field.value) &&
              field.value.length > 0 &&
              !property.required
            }
          ></MultiSelectPieceProperty>
        </AutoFormFieldWrapper>
      );
    case PropertyType.MULTI_SELECT_DROPDOWN:
    case PropertyType.DROPDOWN:
      return (
        <AutoFormFieldWrapper
          inputName={inputName}
          property={property}
          propertyName={propertyName}
          field={field}
          disabled={disabled}
          allowDynamicValues={allowDynamicValues}
        >
          <DynamicDropdownPieceProperty
            refreshers={property.refreshers}
            value={field.value}
            onChange={field.onChange}
            disabled={disabled}
            propertyName={propertyName}
            multiple={property.type === PropertyType.MULTI_SELECT_DROPDOWN}
            showDeselect={!property.required}
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
          inputName={inputName}
          field={field}
          propertyName={propertyName}
          disabled={disabled}
          allowDynamicValues={false}
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
              type={
                property.type === PropertyType.SECRET_TEXT ? 'password' : 'text'
              }
            ></Input>
          )}
        </AutoFormFieldWrapper>
      );
    case PropertyType.DYNAMIC:
      return (
        <DynamicProperties
          refreshers={property.refreshers}
          propertyName={propertyName}
          disabled={disabled}
        ></DynamicProperties>
      );
    case PropertyType.CUSTOM_AUTH:
    case PropertyType.BASIC_AUTH:
    case PropertyType.OAUTH2:
      return <></>;
  }
};
AutoPropertiesFormComponent.displayName = 'AutoFormComponent';
export { AutoPropertiesFormComponent };
