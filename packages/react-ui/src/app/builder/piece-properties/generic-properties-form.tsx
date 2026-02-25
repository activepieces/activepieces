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
import React from 'react';
import { useFormContext } from 'react-hook-form';

import { FormField } from '@/components/ui/form';
import { cn, GAP_SIZE_FOR_STEP_SETTINGS } from '@/lib/utils';

import {
  selectGenericFormComponentForProperty,
  SelectGenericFormComponentForPropertyParams,
} from './properties-utils';

// Helper function to construct property path with proper quoting for special characters
const constructPropertyPath = (prefix: string, propertyName: string): string => {
  if (prefix.length === 0) {
    return propertyName;
  }
  // If property name contains brackets, dots, or other special chars, use bracket notation with quotes
  if (/[\[\]\.]/.test(propertyName)) {
    return `${prefix}['${propertyName}']`;
  }
  // Otherwise use dot notation
  return `${prefix}.${propertyName}`;
};

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
        <div className={cn('flex flex-col', GAP_SIZE_FOR_STEP_SETTINGS)}>
          {Object.entries(props).map(([propertyName]) => {
            const dynamicInputModeToggled =
              propertySettings?.[propertyName]?.type ===
              PropertyExecutionType.DYNAMIC;
            return (
              <FormField
                key={propertyName}
                name={constructPropertyPath(prefixValue, propertyName)}
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
                    inputName: constructPropertyPath(prefixValue, propertyName),
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
