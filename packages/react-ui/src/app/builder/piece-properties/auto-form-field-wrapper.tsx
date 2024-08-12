import { SquareFunction } from 'lucide-react';
import { ControllerRenderProps, useFormContext } from 'react-hook-form';

import { FormItem, FormLabel } from '@/components/ui/form';
import { ReadMoreDescription } from '@/components/ui/read-more-description';
import { Toggle } from '@/components/ui/toggle';
import { PieceProperty } from '@activepieces/pieces-framework';
import { Action, Trigger } from '@activepieces/shared';

import { TextInputWithMentions } from './text-input-with-mentions';

type AutoFormFieldWrapperProps = {
  children: React.ReactNode;
  allowDynamicValues: boolean;
  propertyKey: string;
  property: PieceProperty;
  hideDescription?: boolean;
  placeBeforeLabelText?: boolean;
  disabled: boolean;
  field: ControllerRenderProps<Record<string, any>, string>;
};

const AutoFormFieldWrapper = ({
  placeBeforeLabelText = false,
  children,
  hideDescription,
  allowDynamicValues,
  propertyKey,
  property,
  disabled,
  field,
}: AutoFormFieldWrapperProps) => {
  const form = useFormContext<Action | Trigger>();
  const toggled =
    form.getValues().settings?.inputUiInfo?.customizedInputs?.[propertyKey];

  function handleChange(pressed: boolean) {
    form.setValue(`settings.input.${propertyKey}` as const, '', {
      shouldValidate: true,
    });
    form.setValue(
      `settings.inputUiInfo.customizedInputs.${propertyKey}` as const,
      pressed,
      {
        shouldValidate: true,
      },
    );
  }

  return (
    <FormItem className="flex flex-col gap-1">
      <FormLabel className="flex items-center gap-1">
        {placeBeforeLabelText && !toggled && children}
        <span>{property.displayName}</span>
        {property.required && <span className="text-destructive">*</span>}
        <span className="grow"></span>
        {allowDynamicValues && (
          <Toggle
            pressed={toggled}
            onPressedChange={(e) => handleChange(e)}
            disabled={disabled}
          >
            <SquareFunction />
          </Toggle>
        )}
      </FormLabel>
      {allowDynamicValues && toggled && (
        <TextInputWithMentions
          disabled={disabled}
          onChange={field.onChange}
          initialValue={field.value}
        ></TextInputWithMentions>
      )}
      {!placeBeforeLabelText && !toggled && children}
      {property.description && !hideDescription && (
        <ReadMoreDescription text={property.description} />
      )}
    </FormItem>
  );
};

AutoFormFieldWrapper.displayName = 'AutoFormFieldWrapper';

export { AutoFormFieldWrapper };
