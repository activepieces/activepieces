import { t } from 'i18next';
import {
  ControllerRenderProps,
  FieldValues,
  UseFormReturn,
} from 'react-hook-form';

import { JsonEditor } from '@/components/custom/json-editor';
import { ApMarkdown } from '@/components/custom/markdown';
import { MultiSelectPieceProperty } from '@/components/custom/multi-select-piece-property';
import { SearchableSelect } from '@/components/custom/searchable-select';
import { ColorPicker } from '@/components/ui/color-picker';
import { FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  PieceProperty,
  PiecePropertyMap,
  PropertyType,
} from '@activepieces/pieces-framework';
import { isNil, PropertySettings } from '@activepieces/shared';

import { ArrayPieceProperty } from './array-property';
import { AutoFormFieldWrapper } from './auto-form-field-wrapper';
import { BuilderJsonEditorWrapper } from './builder-json-wrapper';
import CustomProperty from './custom-property';
import { DictionaryProperty } from './dictionary-property';
import { DynamicDropdownPieceProperty } from './dynamic-dropdown-piece-property';
import { DynamicProperties } from './dynamic-piece-property';
import { TextInputWithMentions } from './text-input-with-mentions';

export const selectGenericFormComponentForProperty = ({
  field,
  propertyName,
  inputName,
  property,
  allowDynamicValues,
  markdownVariables,
  useMentionTextInput,
  disabled,
  dynamicInputModeToggled,
  form,
  dynamicPropsInfo,
  propertySettings,
  hideLabel,
}: SelectGenericFormComponentForPropertyParams) => {
  switch (property.type) {
    case PropertyType.ARRAY:
      return (
        <AutoFormFieldWrapper
          property={property}
          hideLabel={hideLabel}
          propertyName={propertyName}
          field={field}
          disabled={disabled}
          inputName={inputName}
          allowDynamicValues={allowDynamicValues}
          dynamicInputModeToggled={dynamicInputModeToggled}
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
          dynamicInputModeToggled={dynamicInputModeToggled}
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
          dynamicInputModeToggled={dynamicInputModeToggled}
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
          dynamicInputModeToggled={dynamicInputModeToggled}
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
          dynamicInputModeToggled={dynamicInputModeToggled}
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
          dynamicInputModeToggled={dynamicInputModeToggled}
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
          dynamicInputModeToggled={dynamicInputModeToggled}
        >
          {isNil(dynamicPropsInfo) ? (
            <div>Error: dynamicPropsInfo is required</div>
          ) : (
            <DynamicDropdownPieceProperty
              refreshers={property.refreshers}
              value={field.value}
              actionOrTriggerName={dynamicPropsInfo.actionOrTriggerName}
              pieceName={dynamicPropsInfo.pieceName}
              pieceVersion={dynamicPropsInfo.pieceVersion}
              form={form}
              placedInside={dynamicPropsInfo.placedInside}
              onChange={field.onChange}
              disabled={disabled}
              propertyName={propertyName}
              multiple={property.type === PropertyType.MULTI_SELECT_DROPDOWN}
              showDeselect={!property.required}
              shouldRefreshOnSearch={property.refreshOnSearch ?? false}
            ></DynamicDropdownPieceProperty>
          )}
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
          dynamicInputModeToggled={dynamicInputModeToggled}
        >
          {useMentionTextInput ? (
            <TextInputWithMentions
              disabled={disabled}
              initialValue={field.value}
              onChange={field.onChange}
            ></TextInputWithMentions>
          ) : (
            <Input
              ref={field.ref}
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
      return dynamicPropsInfo ? (
        <DynamicProperties
          refreshers={property.refreshers}
          propertyName={propertyName}
          disabled={disabled}
          pieceName={dynamicPropsInfo.pieceName}
          pieceVersion={dynamicPropsInfo.pieceVersion}
          actionOrTriggerName={dynamicPropsInfo.actionOrTriggerName}
          placedInside={dynamicPropsInfo.placedInside}
          propertySettings={propertySettings}
          updateFormSchema={dynamicPropsInfo.updateFormSchema}
          updatePropertySettingsSchema={
            dynamicPropsInfo.updatePropertySettingsSchema
          }
        ></DynamicProperties>
      ) : (
        <div>Error: dynamicPropsInfo is required</div>
      );
    case PropertyType.CUSTOM_AUTH:
    case PropertyType.BASIC_AUTH:
    case PropertyType.OAUTH2:
      return <></>;
    case PropertyType.CUSTOM:
      return (
        <CustomProperty
          code={property.code}
          value={field.value}
          onChange={field.onChange}
          disabled={disabled}
          property={property}
        ></CustomProperty>
      );
    case PropertyType.COLOR:
      return (
        <AutoFormFieldWrapper
          property={property}
          inputName={inputName}
          propertyName={propertyName}
          field={field}
          disabled={disabled}
          allowDynamicValues={allowDynamicValues}
          dynamicInputModeToggled={dynamicInputModeToggled}
        >
          <ColorPicker value={field.value} onChange={field.onChange} />
        </AutoFormFieldWrapper>
      );
  }
};

export type SelectGenericFormComponentForPropertyParams = {
  field: ControllerRenderProps<Record<string, any>, string>;
  hideLabel?: boolean;
  propertyName: string;
  inputName: string;
  property: PieceProperty;
  allowDynamicValues: boolean;
  markdownVariables: Record<string, string>;
  useMentionTextInput: boolean;
  disabled: boolean;
  dynamicInputModeToggled: boolean;
  form: UseFormReturn<FieldValues, any, undefined>;
  propertySettings: Record<string, PropertySettings> | null;
  dynamicPropsInfo:
    | ({
        pieceName: string;
        pieceVersion: string;
        actionOrTriggerName: string;
      } & (
        | {
            placedInside: 'stepSettings';
            updateFormSchema: (
              key: string,
              newFieldSchema: PiecePropertyMap,
            ) => void;
            updatePropertySettingsSchema: (
              schema: PiecePropertyMap,
              propertyName: string,
              form: UseFormReturn,
            ) => void;
          }
        | {
            placedInside: 'predefinedAgentInputs';
            updateFormSchema: null;
            updatePropertySettingsSchema: null;
          }
      ))
    | null;
};
