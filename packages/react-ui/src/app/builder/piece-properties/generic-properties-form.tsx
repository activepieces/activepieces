import React from 'react';
import { useFormContext } from 'react-hook-form';

import { FormField } from '@/components/ui/form';
import {
  OAuth2Props,
  PiecePropertyMap,
  ArraySubProps,
} from '@activepieces/pieces-framework';
import {
  FlowActionType,
  FlowTriggerType,
  PropertyExecutionType,
  Step,
} from '@activepieces/shared';

import { selectGenericFormComponentForProperty } from './properties-utils';

type GenericPropertiesFormProps = {
  props: PiecePropertyMap | OAuth2Props | ArraySubProps<boolean>;
  allowDynamicValues: boolean;
  prefixValue: string;
  markdownVariables?: Record<string, string>;
  useMentionTextInput: boolean;
  disabled?: boolean;
  onValueChange?: (val: { value: unknown; propertyName: string }) => void;
};

export const GenericPropertiesFormComponent = React.memo(
  ({
    markdownVariables,
    props,
    allowDynamicValues,
    prefixValue,
    disabled,
    useMentionTextInput,
    onValueChange,
  }: GenericPropertiesFormProps) => {
    const form = useFormContext();
    const step = form.getValues() as Step;

    return (
      Object.keys(props).length > 0 && (
        <div className="flex flex-col gap-4 w-full">
          {Object.entries(props).map(([propertyName]) => {
            const isPieceStep =
              step.type === FlowActionType.PIECE ||
              step.type === FlowTriggerType.PIECE;

            const dynamicInputModeToggled = isPieceStep
              ? step.settings.propertySettings[propertyName]?.type ===
                PropertyExecutionType.DYNAMIC
              : false;

            return (
              <FormField
                key={propertyName}
                name={`${prefixValue}.${propertyName}`}
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
                    inputName: `${prefixValue}.${propertyName}`,
                    property: props[propertyName],
                    allowDynamicValues,
                    markdownVariables: markdownVariables ?? {},
                    useMentionTextInput: useMentionTextInput,
                    disabled: disabled ?? false,
                    dynamicInputModeToggled,
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

GenericPropertiesFormComponent.displayName = 'GenericFormComponent';
