import React from 'react';
import { useFormContext } from 'react-hook-form';

import { FormField } from '@/components/ui/form';
import {
  OAuth2Props,
  PiecePropertyMap,
  ArraySubProps,
} from '@activepieces/pieces-framework';
import {
  isNil,
  PropertyExecutionType,
  PropertySettings,
} from '@activepieces/shared';

import {
  selectGenericFormComponentForProperty,
  SelectGenericFormComponentForPropertyParams,
} from './properties-utils';

export const GenericPropertiesForm = React.memo(
  ({
    markdownVariables,
    props,
    propertySettings,
    prefixValue,
    disabled,
    useMentionTextInput,
    onValueChange,
    dynamicPropsInfo,
  }: GenericPropertiesFormProps) => {
    const form = useFormContext();
    return (
      Object.keys(props).length > 0 && (
        <div className="flex flex-col gap-4 w-full">
          {Object.entries(props).map(([propertyName]) => {
            const dynamicInputModeToggled =
              propertySettings?.[propertyName]?.type ===
              PropertyExecutionType.DYNAMIC;
            return (
              <FormField
                key={propertyName}
                name={
                  prefixValue.length > 0
                    ? `${prefixValue}.${propertyName}`
                    : propertyName
                }
                control={form.control}
                render={({ field }) =>
                  selectGenericFormComponentForProperty({
                    field: {
                      ...field,
                      onChange: (value) => {
                        field.onChange(value);
                        onValueChange?.({
                          value,
                          propertyName,
                        });
                      },
                    },
                    propertyName,
                    inputName:
                      prefixValue.length > 0
                        ? `${prefixValue}.${propertyName}`
                        : propertyName,
                    property: props[propertyName],
                    allowDynamicValues: !isNil(propertySettings),
                    markdownVariables: markdownVariables ?? {},
                    useMentionTextInput: useMentionTextInput,
                    disabled: disabled ?? false,
                    dynamicInputModeToggled,
                    form,
                    dynamicPropsInfo,
                    propertySettings,
                  })
                }
              />
            );
          })}
        </div>
      )
    );
  },
);

GenericPropertiesForm.displayName = 'GenericFormComponent';

type GenericPropertiesFormProps = {
  props: PiecePropertyMap | OAuth2Props | ArraySubProps<boolean>;
  /**Use this to allow user toggling property execution type */
  propertySettings: Record<string, PropertySettings> | null;
  prefixValue: string;
  markdownVariables?: Record<string, string>;
  useMentionTextInput: boolean;
  disabled?: boolean;
  onValueChange?: (val: { value: unknown; propertyName: string }) => void;
  /**for dynamic dropdowns and dynamic properties */
  dynamicPropsInfo: SelectGenericFormComponentForPropertyParams['dynamicPropsInfo'];
};
