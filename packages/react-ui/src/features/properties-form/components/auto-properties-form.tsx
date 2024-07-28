// TODO revisit for clean up
import { Static } from '@sinclair/typebox';
import React from 'react';
import { ControllerRenderProps, useFormContext } from 'react-hook-form';

import { ApMarkdown } from '@/components/custom/markdown';
import { SearchableSelect } from '@/components/custom/searchable-select';
import { ArrayInput } from '@/components/ui/array-input';
import { DictionaryInput } from '@/components/ui/dictionary-input';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { AutoFormFieldWrapper } from '@/features/properties-form/components/auto-form-field-wrapper';
import { formUtils } from '@/features/properties-form/lib/form-utils';
import {
  PieceProperty,
  PiecePropertyMap,
  PropertyType,
} from '@activepieces/pieces-framework';

type AutoFormProps = {
  props: PiecePropertyMap;
  allowDynamicValues: boolean;
  renderSecretText?: boolean;
  onChange?: (value: Record<string, unknown>, valid: boolean) => void;
  renderSecretTextDescription?: boolean;
  prefixValue: string;
};

const AutoPropertiesFormComponent = React.memo(
  ({
    props,
    allowDynamicValues,
    renderSecretText,
    renderSecretTextDescription,
    onChange,
    prefixValue,
  }: AutoFormProps) => {
    const FormSchema = formUtils.buildSchema(props);
    const form = useFormContext<Static<typeof FormSchema>>();

    return (
      <form className="flex flex-col gap-3 p-1">
        {Object.entries(FormSchema.properties).map(([key]) => {
          return (
            <FormField
              name={prefixValue + '.' + key}
              control={form.control}
              key={key}
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  {selectRightComponent(
                    field,
                    key,
                    props[key],
                    allowDynamicValues,
                    renderSecretText,
                    renderSecretTextDescription,
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          );
        })}
      </form>
    );
  },
);

const selectRightComponent = (
  field: ControllerRenderProps<Record<string, any>, string>,
  key: string,
  property: PieceProperty,
  allowDynamicValues: boolean,
  renderSecretText?: boolean,
  renderSecretTextDescription?: boolean,
) => {
  if (renderSecretText && property.type === PropertyType.SECRET_TEXT) {
    return (
      <AutoFormFieldWrapper
        property={property}
        hideDescription={!renderSecretTextDescription}
        key={key}
        allowDynamicValues={allowDynamicValues}
      >
        <Input {...field} id={key} type="password" />
      </AutoFormFieldWrapper>
    );
  }

  switch (property.type) {
    case PropertyType.ARRAY:
      return (
        <AutoFormFieldWrapper
          property={property}
          key={key}
          allowDynamicValues={allowDynamicValues}
        >
          <ArrayInput items={[]} onChange={(items) => {}}></ArrayInput>
        </AutoFormFieldWrapper>
      );
    case PropertyType.OBJECT:
      return (
        <AutoFormFieldWrapper
          property={property}
          key={key}
          allowDynamicValues={allowDynamicValues}
        >
          <DictionaryInput values={{}} onChange={() => {}}></DictionaryInput>
        </AutoFormFieldWrapper>
      );
    case PropertyType.CHECKBOX:
      return (
        <AutoFormFieldWrapper
          property={property}
          key={key}
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
          key={key}
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
      return (
        <AutoFormFieldWrapper
          property={property}
          key={key}
          allowDynamicValues={allowDynamicValues}
        >
          <Input {...field} id={key} type="text" />
        </AutoFormFieldWrapper>
      );
    case PropertyType.BASIC_AUTH:
    case PropertyType.CUSTOM_AUTH:
    case PropertyType.SECRET_TEXT:
    case PropertyType.OAUTH2:
      return (
        <AutoFormFieldWrapper
          property={property}
          key={key}
          allowDynamicValues={allowDynamicValues}
          hideDescription={true}
        >
          <div>Custom Auth</div>
        </AutoFormFieldWrapper>
      );
  }
};
AutoPropertiesFormComponent.displayName = 'AutoFormComponent';
export { AutoPropertiesFormComponent };